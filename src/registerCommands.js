require("dotenv").config();
const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");

const commands = [
    {
        name: "help",
        description: "displays help" ,
    },
    {
        name: "generate",
        description: "generates an image",
        options: [
            {
                name: "prompt",
                description: "Input for image features that you want.",
                type: ApplicationCommandOptionType.String,
                require: true,
            },
            {
                name: "negative_prompt",
                description: "Input for unwanted image features.",
                type: ApplicationCommandOptionType.String,
                require: false,
            },
            {
                name: "steps",
                description: "generation passes on your image. for optimal results try something around 27.",
                type: ApplicationCommandOptionType.Integer,
                max_value: 100,
                min_value:1,
            },
            {
                name: "width",
                description: "Width in pixels",
                type: ApplicationCommandOptionType.Integer,
                max_value: 512,
                min_value: 128,
            },
            {
                name: "height",
                description: "Height in pixels",
                type: ApplicationCommandOptionType.Integer,
                max_value: 512,
                min_value: 128,
            },
            {
                name: "cfg_scale",
                description: "A value from 1 to 30 that determines how close is the result to the prompt.",
                type: ApplicationCommandOptionType.Integer,
                max_value: 30,
                min_value: 1,
            },
            {
                name: "number_of_images",
                description: "Amount of images that will be generated at once.",
                type: ApplicationCommandOptionType.Integer,
                max_value: 4,
                min_value: 1,
            },
        ],
    },
    {
        name: "view_queue",
        description: "Displays generation queue for all gpu servers." ,
    }
];

const rest = new REST({version:"10"}).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Registering slash commands...");

        await rest.put(
            Routes.applicationCommands(process.env.APP_ID),
            { body: commands }
        );
        console.log("Slash commands are registered")

    } catch (error) {
        console.log(`An error had ocured ${error}`);
    }
})();