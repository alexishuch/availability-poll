export const repositoryMock = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn().mockImplementation((target, source) => {
        Object.assign(target, source);
        return target;
    }),
    delete: jest.fn(),
    query: jest.fn(),
};
