import { useState } from 'react'
import type { FormEvent } from 'react'
import { AuthApiError, authenticate } from '../services/authService'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'La contrasena debe tener al menos 8 caracteres.'
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contrasena debe incluir al menos una letra mayuscula.'
  }

  if (!/[a-z]/.test(password)) {
    return 'La contrasena debe incluir al menos una letra minuscula.'
  }

  if (!/\d/.test(password)) {
    return 'La contrasena debe incluir al menos un numero.'
  }

  return null
}

type UseLoginFlowOptions = {
  onLoginSuccess?: () => void
}

export function useLoginFlow(options: UseLoginFlowOptions = {}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  function onUsernameChange(value: string) {
    setUsername(value)
    if (usernameError) {
      setUsernameError('')
    }
  }

  function onPasswordChange(value: string) {
    setPassword(value)
    if (passwordError) {
      setPasswordError('')
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const email = username.trim().toLowerCase()
    const cleanedPassword = password.trim()

    if (!email || !cleanedPassword) {
      setIsError(true)
      setMessage('Correo y contrasena son obligatorios.')
      setUsernameError(!email ? 'El usuario es obligatorio.' : '')
      setPasswordError(!cleanedPassword ? 'La contrasena es obligatoria.' : '')
      return
    }

    if (!EMAIL_REGEX.test(email)) {
      setIsError(true)
      setMessage('Ingresa un correo electronico valido.')
      setUsernameError('Ingresa un correo electronico valido.')
      setPasswordError('')
      return
    }

    const passwordValidationMessage = validatePassword(cleanedPassword)
    if (passwordValidationMessage) {
      setIsError(true)
      setMessage(passwordValidationMessage)
      setUsernameError('')
      setPasswordError(passwordValidationMessage)
      return
    }

    setLoading(true)
    setMessage('')
    setIsError(false)
    setUsernameError('')
    setPasswordError('')

    try {
      await authenticate({ email, password: cleanedPassword })
      setPassword('')
      setIsError(false)
      setMessage('Inicio de sesion exitoso.')
      options.onLoginSuccess?.()
    } catch (error) {
      setIsError(true)
      if (error instanceof AuthApiError) {
        setMessage(error.message)
        if (error.code === 'USER_NOT_FOUND') {
          setUsernameError(error.message)
          setPasswordError('')
        } else {
          setUsernameError('')
          setPasswordError(error.message)
        }
      } else {
        setMessage('No fue posible conectar con el servidor.')
        setUsernameError('')
        setPasswordError('No fue posible conectar con el servidor.')
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    username,
    setUsername: onUsernameChange,
    password,
    setPassword: onPasswordChange,
    usernameError,
    passwordError,
    message,
    isError,
    loading,
    isLocked: false,
    onSubmit,
  }
}