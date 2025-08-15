import { useState } from "react";
import { register } from "../../api/auth";
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t } = useTranslation();
  const [form, setForm] = useState<{
    username: string;
    email: string;
    password: string;
    role: "student" | "instructor" | "admin";
  }>({
    username: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      // TODO: chuyển hướng login
    } catch (err: any) {
      setError(err.response?.data?.message || t("auth.registerFailed"));
    }
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 bg-white rounded shadow"
    >
      <h2 className="text-xl font-bold mb-4">{t("auth.register")}</h2>
      <input
        name="username"
        value={form.username}
        onChange={handleChange}
        placeholder={t("auth.username")}
        required
        className="input input-bordered w-full mb-2"
      />
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder={t("auth.email")}
        required
        className="input input-bordered w-full mb-2"
      />
      <input
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder={t("auth.password")}
        required
        className="input input-bordered w-full mb-2"
      />
      <select
        name="role"
        value={form.role}
        onChange={handleChange}
        className="select select-bordered w-full mb-2"
      >
        <option value="student">{t("auth.student")}</option>
        <option value="instructor">{t("auth.instructor")}</option>
        <option value="admin">{t("auth.admin")}</option>
      </select>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button type="submit" className="btn btn-primary w-full">
        {t("auth.register")}
      </button>
    </form>
  );
}
