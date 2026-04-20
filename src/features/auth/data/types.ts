
// Permite alinear tipos relacionados con la autenticación en un solo lugar

export type Credentials = {
    email: string;
    password: string;
}


export type LoginResponse = {
    token: string
    tokenType: string
    expiresIn: number
    refreshToken?: string
}

export type UserRole = 'ADMINISTRADOR' | 'FISIOTERAPEUTA' | 'MEDICO' | 'UNKNOWN' 
