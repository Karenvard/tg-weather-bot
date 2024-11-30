import {config} from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";

config();

const token = process.env.BOT_TOKEN || "";
const bot = new TelegramBot(token, {polling: true});

const axiosInstance = axios.create({
    baseURL: "http://api.weatherapi.com/v1",
    params: {key: process.env.WEATHER_API_SECRET}
})

axiosInstance.interceptors.response.use(response => {
    return response;
}, error => {
    return error;
});

function sendInfo(reg: string, temp: string, condition: string): string {
    return `Region: ${reg} \nTemperature: ${temp} \n${condition}`
}

async function start() {
    bot.setMyCommands([
        {command: "/start", description: "Start conversation with bot"}
    ])
    bot.on("message", async (message) => {
        if (message.location) return;
        const chatId = message.chat.id;
        const text = message.text;

        if (text === "/start") {
            return bot.sendMessage(chatId, "Hi! I am Weather Bot." +
                " Send me location or city name and" +
                " I will give you weather info.")
        }

        const {data, status} = await axiosInstance.get("/current.json", {params: {q: text}});
        if (status === 200) {
            const weather = data.current;
            return await bot.sendMessage(chatId, sendInfo(data.location.region, weather.temp_c, weather.condition.text));
        }

        await bot.sendMessage(chatId, `Didn't find city "${message.text}"`)
    })


    bot.on("location", async (message) => {
        const chatId = message.chat.id;
        const {data} = await axiosInstance.get("/current.json", {params: {q: `${message.location?.latitude},${message.location?.longitude}`}});
        const weather = data.current;
        bot.sendMessage(chatId, sendInfo(data.location.region, weather.temp_c, weather.condition.text));
    })
}

start()