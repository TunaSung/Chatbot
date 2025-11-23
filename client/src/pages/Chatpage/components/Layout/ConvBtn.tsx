import type { Conversation } from "../../../../types/chat.type";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import type { MenuProps } from "antd";
import { Dropdown, Space } from "antd";
import DeleteBtn from "../Feature/DeleteBtn";
import EditBtn from "../Feature/EditBtn";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../../components/Context/AuthContext";
import { editTile } from "../../../../services/chat.service";
import { deleteConv } from "../../../../services/chat.service";
import { toast } from "react-toastify";

type ConvBtnProps = {
  conv: Conversation;
  currentConvId: number | null;
  handleClick: (id: number) => void;
  onNewChat: () => void;
};

function ConvBtn({
  conv,
  currentConvId,
  handleClick,
  onNewChat,
}: ConvBtnProps) {
  const [title, setTitle] = useState<string>(conv.title);
  const [isEdit, setIsEdit] = useState(false);
  const { refreshConvs } = useAuth();

  // conv.title 從外面更新時，非編輯狀態下同步到內部 state
  useEffect(() => {
    if (!isEdit) {
      setTitle(conv.title);
    }
  }, [conv.title, isEdit]);

  const startEdit = useCallback(() => {
    setTitle(conv.title);
    setIsEdit(true);
  }, [conv.title]);

  const submitTitle = useCallback(async () => {
    const newTitle = title.trim();

    // 沒改或空白不送出
    if (!newTitle || newTitle === conv.title) {
      setIsEdit(false);
      setTitle(conv.title);
      return;
    }

    try {
      await editTile(newTitle, conv.id);
      await refreshConvs();
    } catch (err) {
      toast.error(`名稱更改失敗`);
      console.error("Update title failed", err);
      setTitle(conv.title);
    } finally {
      setIsEdit(false);
    }
  }, [title, conv.id, conv.title, refreshConvs]);

  const handleTitleKeyDown: React.KeyboardEventHandler<
    HTMLInputElement
  > = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await submitTitle();
    } else if (e.key === "Escape") {
      // Esc 取消編輯
      setIsEdit(false);
      setTitle(conv.title);
    }
  };

  const handleTitleBlur: React.FocusEventHandler<
    HTMLInputElement
  > = async () => {
    // 也可以選擇 blur 不送出，只取消；這裡選擇自動送出
    await submitTitle();
  };

  const handleDelete = async (id: number) => {
      try {
        await deleteConv(id);
        refreshConvs();
        onNewChat();
      } catch (error) {
        toast.error("刪除資料失敗");
      }
    };

  const dropItems: MenuProps["items"] = [
    {
      key: "delete",
      label: <DeleteBtn id={conv.id} handleClick={handleDelete} />,
    },
    {
      key: "edit",
      label: <EditBtn onEdit={startEdit} />,
    },
  ];
  
  return (
    <div
      className={`flex justify-between items-center mx-3 px-3 rounded-2xl hover:bg-slate-200 transition-colors duration-150 ${
        currentConvId === conv.id ? "bg-slate-200" : ""
      }`}
    >
      {!isEdit ? (
        <button
          type="button"
          onClick={() => handleClick(conv.id)}
          className="w-full text-left py-3"
        >
          <div className="text-base sm:text-lg md:text-sm font-medium truncate">
            {conv.title}
          </div>
          <div className="text-sm sm:text-base md:text-xs text-slate-500">
            {new Date(conv.updatedAt).toLocaleString()}
          </div>
        </button>
      ) : (
        <div className="w-full py-3">
          <input
            id="title"
            type="text"
            className="border border-slate-300 rounded-md px-2 py-1 w-full text-sm"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            onBlur={handleTitleBlur}
          />
          <div className="mt-1 text-xs text-slate-400">
            Enter 確認，Esc 取消
          </div>
        </div>
      )}
      <Dropdown menu={{ items: dropItems }} trigger={["click"]} className="cursor-pointer" >
        <a onClick={(e) => e.preventDefault()}>
          <Space>
            <HiOutlineDotsHorizontal />
          </Space>
        </a>
      </Dropdown>
      
    </div>
  );
}

export default ConvBtn;
