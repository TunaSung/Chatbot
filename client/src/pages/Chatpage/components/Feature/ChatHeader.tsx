import { useAuth } from "../../../../components/Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { SlMenu } from "react-icons/sl";

type NavbarProps = {
  isBelow768: boolean;
  setIsAsideOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

function Navbar({ isBelow768, setIsAsideOpen }: NavbarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  /**
   * 登出後回到登入頁
   */
  const handleSignOut = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <nav className="flex justify-between items-center p-4 border-b border-slate-300 min-h-16">
      {/* start logo & hamberger menu */}
      <div className="flex gap-3">
        {isBelow768 && (
          <button
            className="text-xl sm:text-2xl"
            onClick={() => setIsAsideOpen(true)}
          >
            <SlMenu />
          </button>
        )}
        <h1 className="text-lg sm:text-2xl md:text-base font-semibold">
          ChatBot Demo
        </h1>
      </div>
      {/* end logo & hamberger menu */}

      {/* start logout */}
      <button
        onClick={handleSignOut}
        className="text-sm sm:text-base md:text-sm px-2 py-1 font-medium text-red-500 md:text-slate-400 border rounded-lg hover:text-red-600 transition-colors duration-150"
        >
        登出
      </button>
      {/* end logout */}
    </nav>
  );
}

export default Navbar;
