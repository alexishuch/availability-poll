import { DataSource } from 'typeorm';
import { PGliteDriver } from 'typeorm-pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { Poll } from 'src/polls/models/poll.entity';
import { Participant } from 'src/participants/models/participant.entity';
import { Availability } from 'src/availabilities/models/availability.entity';

export async function createTestDataSource(): Promise<DataSource> {
    const dataSource = new DataSource({
        type: 'postgres',
        driver: new PGliteDriver({
            database: 'availability_poll_test_db',
            extensions: { btree_gist },
        }).driver,
        synchronize: true,
        logging: false,
        entities: [Poll, Participant, Availability],
    });

    await dataSource.initialize();

    await dataSource.query('CREATE EXTENSION IF NOT EXISTS btree_gist;');
    await dataSource.query(
        'ALTER TABLE "Availabilities" ADD CONSTRAINT uniq_availability_participant_ci EXCLUDE USING gist (slot WITH &&, participant_id WITH =);'
    );
    await dataSource.query(
        'CREATE UNIQUE INDEX uniq_participants_poll_name_ci ON "Participants" (poll_id, LOWER(name));'
    );

    return dataSource;
}

export async function clearTestData(dataSource: DataSource): Promise<void> {
    await dataSource.query('DELETE FROM "Availabilities";');
    await dataSource.query('DELETE FROM "Participants";');
    await dataSource.query('DELETE FROM "Polls";');
}