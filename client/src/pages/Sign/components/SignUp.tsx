import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";
import FloatingField from "./FloatingField";
import { IoPersonOutline } from "react-icons/io5";
import { TbLockPassword } from "react-icons/tb";
import { RiLockPasswordFill } from "react-icons/ri";
import { MdOutlineDriveFileRenameOutline } from "react-icons/md";
import { toast } from "react-toastify";
import { signUp } from "../../../services/auth.service";

type SignUpProps = {
  toggleAuthView: () => void;
};

type FormState = {
  username: string;
  email: string;
  password: string;
  confirm: string;
};

function SignUp({ toggleAuthView }: SignUpProps) {
  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [loading, setLoading] = useState(false);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;
    const username = form.username.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirm = form.confirm;

    if (!username || !email || !password || !confirm) {
      toast.error("All fields are required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await signUp(username, email, password);
      toast.success("Sign up successful");
      // 清表單並切回登入畫面
      setForm({ username: "", email: "", password: "", confirm: "" });
      toggleAuthView();
    } catch (err) {
      toast.error("Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center gap-6"
      >
        <FloatingField
          icon={MdOutlineDriveFileRenameOutline}
          label="Username"
          type="text"
          name="username"
          value={form.username}
          onChange={onChange}
          autoComplete="username"
          required
        />

        <FloatingField
          icon={IoPersonOutline}
          label="Email"
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="email"
          required
        />

        <FloatingField
          icon={TbLockPassword}
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          autoComplete="current-password"
          minLength={6}
          required
        />

        <FloatingField
          icon={RiLockPasswordFill}
          label="Confirm password"
          type="password"
          name="confirm"
          value={form.confirm}
          onChange={onChange}
          autoComplete="new-password"
          minLength={6}
          aria-describedby="pwd-help"
          required
        />

        <button
          type="submit"
          className="border flex self-center rounded-2xl shadow-lg px-6 py-2 font-semibold
          bg-linear-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 hover:-translate-y-1 transition-all duration-200"
        >
          Sign Up
        </button>
      </form>
      <button
        onClick={toggleAuthView}
        className="text-sm text-slate-400 hover:text-blue-500 transition-colors duration-200 mt-2"
      >
        Already have an account?
      </button>
    </>
  );
}

export default SignUp;
