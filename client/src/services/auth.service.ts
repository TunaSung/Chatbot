import api from "./api"
import type { SignInResp, SignUpResp } from "../types/auth.type"
import { getErrorMessage } from "../utils/service"


// token
export const saveToken = (token: string, refreshToken?: string): void => {
    localStorage.setItem("token", token)
    localStorage.setItem("tokenSaveAt", Date.now().toString())
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken)
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
}

export const clearToken = (): void => {
    localStorage.removeItem("token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("tokenSaveAt")
    delete api.defaults.headers.common["Authorization"]
}

export const setAuthHeader = (): void => {
    const token = localStorage.getItem("token")
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }
}

// service
export const signUp = async (
    username: string,
    email: string,
    password: string
): Promise<SignUpResp> => {
    try {
        const res = await api.post<SignUpResp>("/auth/signup", {
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password
        })
        return res.data
    } catch (error) {
        throw new Error(getErrorMessage(error, "Sign up failed"))
    }
}

export const signIn = async (
    email: string,
    password: string
): Promise<SignInResp> => {
    try {
        const res = await api.post<SignInResp>("/auth/signin", {
            email: email.trim().toLowerCase(),
            password
        })
        const { token, refreshToken } = res.data;
        saveToken(token, refreshToken);
        return res.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, "Sign in failed"));
    }
}