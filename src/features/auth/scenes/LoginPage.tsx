import { LoginForm } from '../components/LoginForm'
import { useLoginFlow } from '../data/hooks/useLoginFlow'

type LoginPageProps = {
    onLoginSuccess?: () => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
    const flow = useLoginFlow({ onLoginSuccess })

    return (
        <main className="min-h-screen bg-[#f5f5f5] px-4 py-10">
            <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-8 flex flex-col items-center">
                    {/* Icono Fisiolab */}
                    <div className="flex ">
                        <img src="/logo/logofisiolab.png" alt="" className='w-60 h-40 object-contain' />
                    </div>

                    {/** Subtitulo con icono a la izquierda */}
                    <div className="flex items-center gap-4">
                        
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Inicio de Sesion
                        </h1>
                    </div>
                    <p className="flex justify-center text-sm text-slate-700">
                        Ingresa tus&nbsp;<span className="font-semibold text-slate-900">credenciales</span>&nbsp;para acceder al sistema.
                    </p>
                </div>
                <div className="mt-1">
                    <LoginForm
                        username={flow.username}
                        password={flow.password}
                        usernameError={flow.usernameError}
                        passwordError={flow.passwordError}
                        message={flow.message}
                        isError={flow.isError}
                        loading={flow.loading}
                        isLocked={flow.isLocked}
                        onUsernameChange={flow.setUsername}
                        onPasswordChange={flow.setPassword}
                        onSubmit={flow.onSubmit}
                    />
                </div>


                
            </section>
        </main>
    )
}