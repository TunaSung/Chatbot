import { MdDelete } from "react-icons/md";
import { deleteConv } from "../../../../services/chat.service";
import { useAuth } from "../../../../components/Context/AuthContext";
import { toast } from "react-toastify";

type DeleteBtnProps = {
  id: number;
  onNewChat: () => void;
};

function DeleteBtn({ id, onNewChat }: DeleteBtnProps) {
  const { refreshConvs } = useAuth();
  const handleClick = async (id: number) => {
    console.log(id);
    try {
      await deleteConv(id);
      refreshConvs();
      onNewChat();
      toast.success("刪除資料成功");
    } catch (error) {
      toast.error("刪除資料失敗");
    }
  };
  return (
    <button onClick={() => handleClick(id)}>
      <MdDelete />
    </button>
  );
}

export default DeleteBtn;
