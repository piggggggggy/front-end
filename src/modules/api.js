import axios from "axios";
import { getWithExpiry } from "../modules/localStorageControl";
import TokenService from "../services/token.service";
import tokenService from "../services/token.service";

const headers = {
    Accept: "/",
    "content-type": "application/json;charset=UTF-8",
    "Access-Control-Allow-Origin": "*",
};

const accessToken = {
    Authorization: tokenService.getLocalAccessToken(),
};
const refreshToken = {
    refreshtoken: TokenService.getLocalRefreshToken(),
};

const instance = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
    headers: {
        ...headers,
        ...accessToken,
    },
});

instance.interceptors.request.use(
    (config) => {
        // 로컬에 저장되어 있는 토큰을 가져온다.
        const token = TokenService.getLocalAccessToken();
        console.log("언제실행되는걸까");
        console.log(token);
        //만약에 토큰이 있다면
        if (token) {
            //config의 헤더 안에 토큰을 넣어준다.
            config.headers["accesstoken"] = token; // for Node.js Express back-end
        }
        //요청을 보낸다.
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
instance.interceptors.response.use(
    (res) => {
        return res;
    },
    async (err) => {
        const originalConfig = err.config;
        if (originalConfig.url !== "/api/players/signin" && err.response) {
            // Access Token was expired
            if (err.response.status === 401 && !originalConfig._retry) {
                originalConfig._retry = true;
                try {
                    if (!TokenService.getLocalRefreshToken()) {
                        return alert("로그인 해주세요");
                    }

                    console.log("실행되나");
                    const rs = await axios.get("/api/players/auth/getToken", {
                        baseURL: process.env.REACT_APP_BASE_URL,
                        headers: {
                            ...headers,
                            ...refreshToken,
                        },
                    });

                    const accesstoken = rs.headers["accesstoken"];

                    if (!TokenService.getLocalAccessToken()){
                        TokenService.setAccessToken(accesstoken);
                    }
                    TokenService.updateLocalAccessToken(accesstoken);
                    return instance(originalConfig);
                } catch (_error) {
                    console.log(_error.message);
                    return Promise.reject(_error);
                }
            }
        }
        return Promise.reject(err);
    }
);
export default instance;
