// Polls
const fixedCreatedAt = new Date('2025-01-01T00:00:00Z');

export const testPollData = { name: 'Test Poll', created_at: fixedCreatedAt };

export const testPollWithDatesData = {
    name: 'Dated Poll',
    start_date: new Date('2025-01-02'),
    end_date: new Date('2025-01-12'),
    created_at: fixedCreatedAt
};

export const localePollStartDate = '1/2/2025';

export const localePollEndDate = '1/12/2025';

// Participants
export const testParticipantData = { name: 'Guy' };

export const nonExistentParticipantId = '611537fc-c088-4d09-abd8-3416f818e513';

export const nonExistentAvailabilityId = '722637fc-c088-4d09-abd8-3416f818e514';

// Availabilities
export const slotStartTimestamp = new Date('2025-01-02T10:00:00Z');

export const slotEndTimestamp = new Date('2025-01-02T11:00:00Z');

export const formattedSlot = '{["2025-01-02T10:00:00.000Z","2025-01-02T11:00:00.000Z")}';
export const formattedSlotFromDB = '{["2025-01-02 10:00:00","2025-01-02 11:00:00")}';