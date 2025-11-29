import { MdEdit } from "react-icons/md";
import { memo } from "react";

type EditBtnProps = {
    onEdit: () => void
}
function EditBtn({ onEdit }: EditBtnProps) {
    return (
        <button onClick={onEdit}>
            <MdEdit />
        </button>
    )
}

export default memo(EditBtn)