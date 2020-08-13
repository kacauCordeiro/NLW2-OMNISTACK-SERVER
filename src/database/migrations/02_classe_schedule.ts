import knex from 'knex';

export async function up(knex: knex){
    return knex.schema.createTable('classe_schedule', table =>{
        table.increments('id').primary();
        table.integer('weekday').notNullable();
        table.integer('from').notNullable();
        table.integer('to').notNullable();
        
        table.integer('classe_id')
        .notNullable()
        .references('id')
        .inTable('classes')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
    }
    )
}

export async function down(knex: knex){
    return knex.schema.dropTable('classe_schedule');

}

