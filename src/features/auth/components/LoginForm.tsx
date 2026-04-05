import { useState } from 'react'
import type { FormEvent } from 'react'

interface LoginFormProps {
    username: string;
    password: string;
    usernameError: string;
    passwordError: string;
    message: string;
    isError: boolean;
    loading: boolean;
    isLocked: boolean;
    onUsernameChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export function LoginForm({
    username,
    password,
    usernameError,
    passwordError,
    message,
    isError,
    loading,
    isLocked,
    onUsernameChange,
    onPasswordChange,
    onSubmit,
}: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <form onSubmit={onSubmit} className=" pb-3">

            {message ? (
                <div
                    className={`mx-auto mb-4 w-full max-w-xs rounded-xl border px-4 py-3 text-sm ${
                        isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                >
                    {message}
                </div>
            ) : null}

            {/* Input Email */}
            <div className="mx-auto w-full max-w-xs">
                <input
                    type="email"
                    value={username}
                    onChange={(e) => onUsernameChange(e.target.value)}
                    placeholder="Correo electrónico"
                    disabled={loading || isLocked}
                    className={`w-full rounded-xl border px-3 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-slate-300 ${
                        usernameError || isError ? 'border-red-300' : 'border-slate-200'
                    }`}
                />
                <div className="mx-auto w-full max-w-xs space-y-2 mt-6">
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            placeholder="Contraseña"
                            disabled={loading || isLocked}
                            className={`w-full rounded-xl border px-3 py-3 pr-24 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-slate-300 ${
                                passwordError || isError ? 'border-red-300' : 'border-slate-200'
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600"
                        >
                            {showPassword ? 'Ocultar' : 'Mostrar'}
                        </button>
                    </div>

                    <button type="button" className="px-0 text-xs font-medium text-black hover:text-black/80">
                        Olvido su contraseña?
                    </button>
                </div>
                <div className="mx-auto w-full max-w-xs space-y-1">
                    {/* Botón de login */}
                    <button
                        type="submit"
                        disabled={isLocked}
                        className="mx-auto mt-5 block h-auto w-full max-w-xs rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </div>

            </div>

            {/* Input Contraseña */}



            <div className="mx-auto mt-9 w-full max-w-xs space-y-4 text-left">

                <div className="mx-auto mt-9 w-full max-w-xs space-y-4">
                    <div className="my-6 flex items-center gap-3 text-xs font-medium tracking-wide text-slate-400">
                        <span className="h-px flex-1 bg-slate-200" />
                        O CONTINUA CON
                        <span className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Botón Google */}
                        <button
                            type="button"
                            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.4-.2-2H12z" />
                                <path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.5-2.4l-3-2.3c-.8.6-2 .9-3.5.9-2.7 0-4.9-1.8-5.7-4.2l-3.1 2.4C4.9 19.8 8.2 22 12 22z" />
                                <path fill="#FBBC05" d="M6.3 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.2 7.6C2.4 9 2 10.5 2 12s.4 3 1.2 4.4L6.3 14z" />
                                <path fill="#4285F4" d="M12 5.8c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.7 2.8 14.5 2 12 2 8.2 2 4.9 4.2 3.2 7.6L6.3 10c.8-2.4 3-4.2 5.7-4.2z" />
                            </svg>
                            <span>Continuar con Google</span>
                        </button>

                        {/* Botón Facebook */}
                        <button
                            type="button"
                            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-600"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
                            </svg>
                            <span>Continuar con Facebook</span>
                        </button>

                        {/* Botón Apple */}
                        <button
                            type="button"
                            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-black hover:text-white"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M16.7 12.6c0-2.5 2-3.7 2.1-3.8-1.1-1.6-2.9-1.8-3.5-1.8-1.5-.2-2.9.9-3.7.9-.8 0-2-.8-3.3-.8-1.7 0-3.2 1-4.1 2.5-1.8 3.1-.5 7.8 1.3 10.4.9 1.3 2 2.8 3.4 2.7 1.4-.1 1.9-.9 3.6-.9s2.2.9 3.6.9c1.5 0 2.4-1.3 3.3-2.6 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.6z" />
                                <path fill="currentColor" d="M14.4 5.4c.7-.8 1.2-1.9 1.1-3-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 .9.1 2.1-.5 2.8-1.5z" />
                            </svg>
                            <span>Continuar con Apple</span>
                        </button>
                    </div>
                </div>



            </div>
        </form>
    )
}