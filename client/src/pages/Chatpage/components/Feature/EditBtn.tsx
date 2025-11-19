import { MdEdit } from "react-icons/md";
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

export default EditBtn