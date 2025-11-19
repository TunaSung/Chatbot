import { MdDelete } from "react-icons/md"
import { deleteConv } from "../../../../services/chat.service"
import { useAuth } from "../../../../components/Context/AuthContext"
import { toast } from "react-toastify"

type DeleteBtnProps = {
    id: number
}

function DeleteBtn({ id }: DeleteBtnProps){
    const { refreshConvs } = useAuth()
    const handleClick = async (id: number) => {
        console.log(id)
        try { 
            await deleteConv(id)
            refreshConvs()
        } catch (error) {
            toast.error("刪除資料失敗")
        }

    }
    return (
        <button onClick={() => handleClick(id)}>
            <MdDelete />
        </button>
    )
}

export default DeleteBtn