import { Request, Response } from 'express';
import db from '../database/connection';
import convertHourToMinutes from '../utils/convertHourToMinutes';
interface scheduleItem {
    weekday: number,
    from: string,
    to: string
}

export default class ClassesControllers{
    async index(request: Request, response: Response){
        // RECUPERO PARAMETROS DA URL
        const filters = request.query;
        // TRATO OS FILTROS
        const subject = filters.subject as string
        const weekday = filters.weekday as string
        const time = filters.time as string
        // VALIDO OS FILTROS
        if (!filters.weekday || !filters.subject || !filters.time){
            return response.status(400).json({
                error: 'Missing filter'
            })
        }

        // CONVERTO PARA MINUTOS
        const timeInMinutes = convertHourToMinutes(time);
        //QUERY
        const classes = await db('classes')
        .whereExists(function(){
          this.select('classe_schedule.*')
          .from('classe_schedule')
          .whereRaw('`classe_schedule`.`classe_id` = ??', [Number(weekday)])
          .whereRaw('`classe_schedule`.`from` <= ??', [timeInMinutes])
          .whereRaw('`classe_schedule`.`to` > ??', [timeInMinutes])
        })
        .where('classes.subject','=',subject)
        .join('users','classes.user_id','=','users.id')
        .select(['classes.*','users.*']);

        return response.json(classes)
    }

    async create(request: Request, response: Response){
        const {
            name,
            avatar,
            whatsapp,
            bio,
            subject,
            cost,
            schedule
      
        } = request.body;
      // SUBSTITUINDO O DB POR TRANSACTION / CASO FALHE, NENHUM CADASTRO É REALIZADO
      const trx = await db.transaction();
      
      try{
      //INSERINDO USUÁRIO
      const insertedUsersId = await trx('users').insert({ name,
          avatar,
          whatsapp,
          bio
      
        })
      
        const user_id = insertedUsersId[0];
      
      //INSERINDO AULA
        const insertedClassesId =  await trx('classes').insert({subject,
          cost,
          user_id
        })
      
        const classe_id = insertedClassesId[0];
      
      //INSERINDO HORÁRIOS DE AULAS 
      const classe_schedule = schedule.map((scheduleItem: scheduleItem) =>{
          
      return{
          classe_id,
          weekday: scheduleItem.weekday,
          from: convertHourToMinutes(scheduleItem.from),
          to: convertHourToMinutes(scheduleItem.to)
      };
      })
      
        await trx('classe_schedule').insert(classe_schedule);
      
        await trx.commit();
      
        return response.status(201).send();
      }catch (err){
          await trx.rollback();
          return response.status(400).json({
              error:'Unexpected error while creating new class'
          })
      }
      
    }
}

