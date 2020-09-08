// import * as SphinxBot from '../../../sphinx-bot'
import * as SphinxBot from 'sphinx-bot'
import * as MotherBot from './mother'
import * as WelcomeBot from './welcome'
import {Msg} from '../network/interfaces'
import * as path from 'path'
import { models } from '../models'

const constants = require(path.join(__dirname, '../../config/constants.json'))

async function init(){
    MotherBot.init()

    const builtInBots = await models.ChatBot.findAll({where:{
        botType: constants.bot_types.builtin
    }})
    if(!(builtInBots && builtInBots.length)) return

    builtInBots.forEach(b=>{
        if(b.botPrefix==='/welcome') WelcomeBot.init()
    })
}

function builtinBotEmit(msg:Msg){
    const m = <SphinxBot.Message>{
        channel:{
            id: msg.chat.uuid,
            send:function(){},
        },
        reply:function(){},
        content: msg.message.content,
        type: msg.type,
        member: {
            id:'_',
            nickname: msg.sender.alias,
            roles:[]
        }
    }
    if(msg.sender.role===constants.chat_role.owner) {
        if(m.member) m.member.roles=[{
            name:'Admin'
        }]
    }
    SphinxBot._emit('message', m)
}

export {init,builtinBotEmit}
