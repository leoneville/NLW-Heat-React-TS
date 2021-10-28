import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

interface IUser {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

interface IAuthContextData {
  user: IUser | null;
  signInUrl: string;
  signOut: () => void;
}

interface IAuthResponse {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  }
}

export const AuthContext = createContext({} as IAuthContextData);

interface IAuthProvider {
  children: ReactNode;
}

export function AuthProvider(props: IAuthProvider)
{
  const [user, setUser] = useState<IUser | null>(null);

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=94ad2f1aeb4fd1f06905`;

  async function signIn(githubCode: string)
  {
    const response = await api.post<IAuthResponse>("authenticate", {
      code: githubCode
    });

    const { token, user } = response.data;

    localStorage.setItem("@dowhile:token", token);

    api.defaults.headers.common.authorization = `Bearer ${token}`;

    setUser(user);
  }

  function signOut() 
  {
    setUser(null);
    localStorage.removeItem("@dowhile:token");
  }

  useEffect(() => {
    const token = localStorage.getItem("@dowhile:token");

    if (token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`;

      api.get<IUser>("profile").then(response => {
        setUser(response.data);
      });
    }
  }, [])

  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes("?code=");

    if (hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split("?code=");
      window.history.pushState({}, '', urlWithoutCode);

      signIn(githubCode);
    }
  }, [])

  return (
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      {props.children}
    </AuthContext.Provider>
  );
}