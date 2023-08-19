require("dotenv").config();
const { Client, GatewayIntentBits, ApplicationCommandOptionType, ActivityType, EmbedBuilder, AttachmentBuilder } = require("discord.js");

const axios = require('axios');
const fs = require('fs');
const path = require("path");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

function loadScript(scriptPath) {
    try {
        require(scriptPath);
    } catch (error) {
        console.error(`Error loading script ${scriptPath}:`, error);
    }
}

//list of gpu servers
const urls = ["http://127.0.0.1:7860","http://192.168.1.131:7860"];


//when the bot joins a server
client.on('guildCreate', (guild) => {
    loadScript("./registerCommands.js");
    const GreetingsEmbed = new EmbedBuilder()
        .setTitle("Greetings!")
        .setThumbnail(client.user.displayAvatarURL())
        .setColor(0x9A1548)
        .addFields({
            name: "What am I able to do?",
            value: "I'm an AI that can generate images from your description."
        },
        {
            name: "How to generate an image.",
            value: `If you want to generate an image you can use the /generate command. The only required field is the prompt you
                can leave everything else to me or if you want to fine tune your image with more parameters, you can use /help to get more
                information about the different settings.`
        },
        );
    guild.systemChannel.send({embeds: [GreetingsEmbed]});
});

client.on("ready", () => {
    loadScript("./registerCommands.js");
    client.user.setActivity({
        name: "/help",
        type: ActivityType.Listening,
    });
    console.log(`${client.user.tag} is online`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;






    if (interaction.commandName === "help") 
    {
        const helpEmbed = new EmbedBuilder()
        .setTitle("Seraphina")
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription("Basic usecase Information for the /generate command.")
        .setColor(0x9A1548)
        .addFields({
            name: "prompt",
            value: "Prompt allows users to describe what they want to generate. For example prompt can look something like this: blue sky, clouds, grass, tree, high detail, etc..."
        },
        {
            name: "negative_prompt",
            value: "This field is similar to prompt, eccept that instead of writing what you want, you need to write what you dont want in the image."
        },
        {
            name: "steps",
            value: "Steps is how many render passes will the gpu do to create your image, It's recommanded to set the value arround 30, but you can experiment on your own."
        },
        {
            name: "width & height",
            value: "This is somewhat self explanetory, it's the image size in pixels. By default its set to 512x512. You can change it or leave as it is."
        },
        {
            name: "cfg_scale",
            value: "The higher the cfg_scale is the more it will be focused on what you wrote to prompt and it will match more with your description."
        },
        {
            name: "number_of_images",
            value: "You can use this parameter to generate more than one image. Keep in mind that generating more images will take more time."
        }
        );
        await interaction.reply({embeds: [helpEmbed]});
        //await interaction.reply("To generate an image, use the generate function.\nMake a prompt, for example: cloudy sky, vivid, high contrast, etc...\nThen set the generation steps, usually around 30 steps will give you the best results.");
    }





    if (interaction.commandName === "generate") 
    {

        const prompt = interaction.options.getString('prompt');
        const negative_prompt = interaction.options.getString('negative_prompt');
        var steps = interaction.options.getInteger('steps');
        var width = interaction.options.getInteger('width');
        var height = interaction.options.getInteger('height');
        var cfg_scale = interaction.options.getInteger('cfg_scale');
        var n_iter = interaction.options.getInteger('number_of_images');


        if(steps == null){
            steps = 27;
        }
        if(width == null){
            width = 512;
        }
        if(height == null){
            height = 512;
        }
        if(cfg_scale == null){
            cfg_scale = 7;
        }
        if(n_iter == null){
            n_iter = 1;
        }

        //Informs user that the input is being processed
        if(n_iter < 2){
            await interaction.reply(`<@${interaction.user.id}> Your input was added to a queue. I will inform you when the image is ready.`);
        }
        else
        {
            await interaction.reply(`<@${interaction.user.id}> Your input was added to a queue. I will inform you when the images are ready.`);
        }

        //payload structure thats sent to the model API
        const payload = {
            prompt,
            steps,
            negative_prompt,
            width,
            height,
            cfg_scale,
            "sampler_name": "DPM++ 2M SDE Karras",
            n_iter
        };

        try {

            //finds the least bussy server to generate the images
            const Servers = [];
            urls.forEach(async url => {
                QueueStatus = await axios.get(`${url}/queue/status`);
            });


            //requests images from the least bussy server (needs to be implemented)
            const response = await axios.post(`${urls[1]}/sdapi/v1/txt2img`, payload);
            
            const base64Data = [];
            var buffer = [];
            const imagePath = [];

            imageIndex = 0;

            response.data.images.forEach(image => {
                base64Data[imageIndex] = image;
                buffer[imageIndex] = Buffer.from(base64Data[imageIndex], 'base64');

                imagePath[imageIndex] = path.join(__dirname, `../images/image${imageIndex}.png`);
                fs.writeFileSync(imagePath[imageIndex], buffer[imageIndex]);
                imageIndex++;
            });
            
            switch (imagePath.length){
                case 1:
                    await interaction.followUp({ content: `Your image is ready!`, ephemeral: true, files: [imagePath[0]] });
                    return;
                case 2:
                    await interaction.followUp({ content: `Your images are ready!`, ephemeral: true, files: [imagePath[0], imagePath[1]] });
                    return;
                case 3:
                    await interaction.followUp({ content: `Your images are ready!`, ephemeral: true, files: [imagePath[0], imagePath[1], imagePath[2]] });
                    return;
                case 4:
                    await interaction.followUp({ content: `Your images are ready!`, ephemeral: true, files: [imagePath[0], imagePath[1], imagePath[2], imagePath[3]] });
                    return;
            }

        } catch (error) {
            console.error('Error:', error);
            await interaction.followUp({ content: `Something went wrong. try to generate your image later.`, ephemeral: true });
        }
    }





    //displays the queue to users
    if (interaction.commandName === "view_queue") 
    {
        try {
            urls.forEach(async url => {
                console.log(url);
                QueueStatus = await axios.get(`${url}/queue/status`);
                console.log(QueueStatus);
            });
            interaction.reply(`This function is not fully implemented yet...`);
        } catch (error) {
            console.log(error);
            interaction.reply(`Server failed to respond to the command`);
        }
    }
});

client.login(process.env.TOKEN);