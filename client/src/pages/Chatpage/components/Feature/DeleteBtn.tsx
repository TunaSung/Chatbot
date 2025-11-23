import { MdDelete } from "react-icons/md";

type DeleteBtnProps = {
  id: number
  handleClick: (id: number) => Promise<void>
};

function DeleteBtn({ id, handleClick }: DeleteBtnProps) {
  return (
    <button onClick={() => handleClick(id)}>
      <MdDelete />
    </button>
  );
}

export default DeleteBtn;
