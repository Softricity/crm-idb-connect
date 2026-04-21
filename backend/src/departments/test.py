import discord
from discord.ext import commands
import asyncio

intents = discord.Intents.all()
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")

# Command 1: Delete ALL channels
@bot.command()
@commands.has_permissions(administrator=True)
async def delch(ctx):
    await ctx.message.delete()
    guild = ctx.guild
    for channel in guild.channels[:]:  # copy list
        try:
            await channel.delete(reason="nuke")
            await asyncio.sleep(0.6)  # respect per-guild channel delete limits
        except:
            pass  # ignore failures (already deleted, no perms, etc.)

# Command 2: Ban ALL members (except bot itself)
@bot.command()
@commands.has_permissions(ban_members=True)
async def banall(ctx):
    await ctx.send("Should I ban everyone? (y/n)")
    if (await bot.wait_for("message", check=lambda m: m.author == ctx.author and m.content.lower() in ["y", "n"])).content.lower() != "y":
        await ctx.send("Aborting banall.")
        return
    await ctx.message.delete()
    guild = ctx.guild
    for member in guild.members:
        if member == bot.user or member.bot:  # skip self and other bots
            continue
        try:
            await guild.ban(member, reason="nuke", delete_message_days=1)
            await asyncio.sleep(0.8)  # ban rate limit is ~5 per 5s per guild → ~0.8s safe
        except:
            pass

bot.run("YOUR_DISCORD_BOT_TOKEN")