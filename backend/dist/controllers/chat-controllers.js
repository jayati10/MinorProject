import user from "../models/user.js";
import { configureOpenAI } from "../config/openai-config.js";
import { OpenAIApi } from "openai";
export const generateChatCompletion = async (req, res, next) => {
    const { message } = req.body;
    try {
        const users = await user.findById(res.locals.jwtData.id);
        if (!users)
            return res
                .status(401)
                .json({ message: "User not registered or Token malfunction" });
        //grab chats of user
        const chats = users.chats.map(({ role, content }) => ({
            role,
            content,
        }));
        chats.push({ content: message, role: "user" });
        users.chats.push({ content: message, role: "user" });
        //send all chats with new one to openAI API
        const config = configureOpenAI();
        const openai = new OpenAIApi(config);
        //get latest response
        const chatResponse = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: chats,
        });
        users.chats.push(chatResponse.data.choices[0].message);
        await users.save();
        return res.status(200).json({ chats: users.chats });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};
export const sendChatsToUser = async (req, res, next) => {
    try {
        //user token check
        const users = await user.findById(res.locals.jwtData.id);
        if (!users) {
            return res.status(401).send("User not registered or Token malfunction");
        }
        if (users._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }
        return res.status(200).json({ message: "OK", chats: users.chats });
    }
    catch (error) {
        console.log(error);
        return res.status(200).json({ message: "ERROR", cause: error.message });
    }
};
export const deleteChats = async (req, res, next) => {
    try {
        //user token check
        const users = await user.findById(res.locals.jwtData.id);
        if (!users) {
            return res.status(401).send("User not registered or Token malfunction");
        }
        if (users._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }
        //@ts-ignore
        users.chats = [];
        await users.save();
        return res.status(200).json({ message: "OK" });
    }
    catch (error) {
        console.log(error);
        return res.status(200).json({ message: "ERROR", cause: error.message });
    }
};
//# sourceMappingURL=chat-controllers.js.map