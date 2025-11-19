import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";
import FloatingField from "./FloatingField";
import { IoPersonOutline } from "react-icons/io5";
import { TbLockPassword } from "react-icons/tb";
import { toast } from "react-toastify";
import { signIn } from "../../../services/auth.service";
import { useAuth } from "../../../components/Context/AuthContext";
import { useNavigate } from "react-router-dom";

type SignInProps = {
  toggleAuthView: () => void;
};

type FormState = {
  email: string;
  password: string;
};

function SignIn({ toggleAuthView }: SignInProps) {
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })),
    []
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const res = await signIn(email, password);
      login(res.token);
      toast.success("Sign in successful");
      navigate("/chat");
    } catch (err) {
      toast.error("Sign in failed");
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

        <button
          type="submit"
          className="border flex self-center rounded-2xl shadow-lg px-6 py-2 font-semibold
          bg-linear-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 hover:-translate-y-1 transition-all duration-200"
        >
          Sign In
        </button>
      </form>
      <div className="text-sm flex flex-col">
        <button className="text-slate-400 hover:text-red-500 transition-colors duration-200">
          Forget password?
        </button>
        <button
          onClick={toggleAuthView}
          className="text-slate-400 hover:text-blue-500 transition-colors duration-200 mt-2"
        >
          Don’t have an account?
        </button>
      </div>
    </>
  );
}

export default SignIn;
