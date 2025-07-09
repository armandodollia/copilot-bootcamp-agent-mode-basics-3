const request = require('supertest');

// Mock better-sqlite3 module before importing the app
jest.mock('better-sqlite3', () => {
  const mockStatement = {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn()
  };
  
  return jest.fn().mockImplementation(() => ({
    exec: jest.fn(),
    prepare: jest.fn(() => mockStatement),
    close: jest.fn()
  }));
});

const { app, db, insertStmt } = require('../src/app');

// Mock data for testing
const mockItems = [
  { id: 1, name: 'Test Item 1', created_at: '2025-07-09 10:00:00' },
  { id: 2, name: 'Test Item 2', created_at: '2025-07-09 11:00:00' },
  { id: 3, name: 'Test Item 3', created_at: '2025-07-09 12:00:00' }
];

// Mock database responses
const mockDbResponses = {
  existingItem: { id: 1, name: 'Test Item 1', created_at: '2025-07-09 10:00:00' },
  nonExistentItem: undefined,
  deleteSuccess: { changes: 1, lastInsertRowid: null },
  deleteFailure: { changes: 0, lastInsertRowid: null }
};

// Mock console methods to prevent test output pollution
const mockConsole = {
  error: jest.fn(),
  log: jest.fn()
};

// Mock database statement methods
const mockDbStatements = {
  selectStmt: {
    get: jest.fn()
  },
  deleteStmt: {
    run: jest.fn().mockReturnValue({ changes: 1, lastInsertRowid: null })
  }
};

// Helper function to reset all mocks
const resetMocks = () => {
  jest.clearAllMocks();
  mockConsole.error.mockClear();
  mockConsole.log.mockClear();
  mockDbStatements.selectStmt.get.mockClear();
  mockDbStatements.deleteStmt.run.mockClear();
  db.prepare.mockClear();
  // Reset insertStmt mock if it exists
  if (insertStmt && insertStmt.run && insertStmt.run.mockClear) {
    insertStmt.run.mockClear();
  }
};

// Helper function to setup database mocks for delete endpoint tests
const setupDeleteMocks = (itemExists = true, deleteSuccessful = true) => {
  mockDbStatements.selectStmt.get.mockReturnValue(
    itemExists ? mockDbResponses.existingItem : mockDbResponses.nonExistentItem
  );
  
  mockDbStatements.deleteStmt.run.mockReturnValue(
    deleteSuccessful ? mockDbResponses.deleteSuccess : mockDbResponses.deleteFailure
  );

  // The real endpoint calls db.prepare twice - once for SELECT, once for DELETE
  db.prepare
    .mockReturnValueOnce(mockDbStatements.selectStmt) // First call for SELECT statement
    .mockReturnValueOnce(mockDbStatements.deleteStmt); // Second call for DELETE statement

  return { 
    selectStmt: mockDbStatements.selectStmt, 
    deleteStmt: mockDbStatements.deleteStmt 
  };
};

// Close the database connection after all tests
afterAll(() => {
  if (db && db.close) {
    db.close();
  }
});

describe('API Endpoints', () => {
  beforeEach(() => {
    resetMocks();
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(mockConsole.error);
    jest.spyOn(console, 'log').mockImplementation(mockConsole.log);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('DELETE /api/items/:id', () => {
    describe('Successful deletion', () => {
      it('should delete an existing item and return success message', async () => {
        // Arrange
        const itemId = '1';
        const { selectStmt, deleteStmt } = setupDeleteMocks(true, true);

        // Act
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(200);

        // Assert
        expect(response.body).toEqual({
          message: 'Item deleted successfully'
        });
        expect(selectStmt.get).toHaveBeenCalledWith(itemId);
        expect(deleteStmt.run).toHaveBeenCalledWith(itemId);
        expect(db.prepare).toHaveBeenCalledTimes(2);
        expect(db.prepare).toHaveBeenNthCalledWith(1, 'SELECT * FROM items WHERE id = ?');
        expect(db.prepare).toHaveBeenNthCalledWith(2, 'DELETE FROM items WHERE id = ?');
      });

      it('should handle deletion of item with string ID', async () => {
        // Arrange
        const itemId = '42';
        const { selectStmt, deleteStmt } = setupDeleteMocks(true, true);

        // Act
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(200);

        // Assert
        expect(response.body.message).toBe('Item deleted successfully');
        expect(selectStmt.get).toHaveBeenCalledWith(itemId);
        expect(deleteStmt.run).toHaveBeenCalledWith(itemId);
      });
    });

    describe('Error handling', () => {
      it('should return 404 when item does not exist', async () => {
        // Arrange
        const itemId = '999';
        mockDbStatements.selectStmt.get.mockReturnValue(mockDbResponses.nonExistentItem);
        db.prepare.mockReturnValueOnce(mockDbStatements.selectStmt); // Only SELECT statement

        // Act
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(404);

        // Assert
        expect(response.body).toEqual({
          error: 'Item not found'
        });
        expect(mockDbStatements.selectStmt.get).toHaveBeenCalledWith(itemId);
        expect(db.prepare).toHaveBeenCalledTimes(1); // Only SELECT statement should be called
        expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM items WHERE id = ?');
      });

      it('should return 404 for non-numeric item ID when item does not exist', async () => {
        // Arrange
        const itemId = 'invalid-id';
        mockDbStatements.selectStmt.get.mockReturnValue(mockDbResponses.nonExistentItem);
        db.prepare.mockReturnValueOnce(mockDbStatements.selectStmt);

        // Act
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(404);

        // Assert
        expect(response.body.error).toBe('Item not found');
        expect(mockDbStatements.selectStmt.get).toHaveBeenCalledWith(itemId);
      });

      it('should return 500 when database SELECT query throws an error', async () => {
        // Arrange
        const itemId = '1';
        const errorMessage = 'Database connection failed';
        
        // Setup mock to throw error on SELECT
        mockDbStatements.selectStmt.get.mockImplementation(() => {
          throw new Error(errorMessage);
        });
        
        db.prepare.mockReturnValueOnce(mockDbStatements.selectStmt);

        // Act
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(500);

        // Assert
        expect(response.body).toEqual({
          error: 'Failed to delete item'
        });
        expect(mockConsole.error).toHaveBeenCalledWith('Error deleting item:', expect.any(Error));
        expect(mockDbStatements.selectStmt.get).toHaveBeenCalledWith(itemId);
      });

      it('should return 500 when database DELETE query throws an error', async () => {
        // Arrange
        const itemId = '1';
        const errorMessage = 'Database write failed';
        
        // Setup mocks - SELECT succeeds, DELETE fails
        mockDbStatements.selectStmt.get.mockReturnValue(mockDbResponses.existingItem);
        mockDbStatements.deleteStmt.run.mockImplementation(() => {
          throw new Error(errorMessage);
        });

        db.prepare
          .mockReturnValueOnce(mockDbStatements.selectStmt)
          .mockReturnValueOnce(mockDbStatements.deleteStmt);

        // Act
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(500);

        // Assert
        expect(response.body).toEqual({
          error: 'Failed to delete item'
        });
        expect(mockConsole.error).toHaveBeenCalledWith('Error deleting item:', expect.any(Error));
        expect(mockDbStatements.selectStmt.get).toHaveBeenCalledWith(itemId);
        expect(mockDbStatements.deleteStmt.run).toHaveBeenCalledWith(itemId);
      });

      it('should return 404 when db.prepare throws an error', async () => {
        // Arrange
        const itemId = '1';
        const errorMessage = 'Failed to prepare statement';
        
        db.prepare.mockImplementation(() => {
          throw new Error(errorMessage);
        });

        // Act
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(500);

        // Assert
        expect(response.body).toEqual({
          error: 'Failed to delete item'
        });
        expect(mockConsole.error).toHaveBeenCalledWith('Error deleting item:', expect.any(Error));
        expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM items WHERE id = ?');
      });

      it('should return 404 when DELETE statement reports zero changes', async () => {
        // Arrange
        const itemId = '1';
        const zeroChangesResult = { changes: 0, lastInsertRowid: null };
        
        // Setup mocks - SELECT succeeds, DELETE reports zero changes
        mockDbStatements.selectStmt.get.mockReturnValue(mockDbResponses.existingItem);
        mockDbStatements.deleteStmt.run.mockReturnValue(zeroChangesResult);

        db.prepare
          .mockReturnValueOnce(mockDbStatements.selectStmt)
          .mockReturnValueOnce(mockDbStatements.deleteStmt);

        // Act
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(404);

        // Assert
        expect(response.body).toEqual({
          error: 'Item not found'
        });
        expect(mockDbStatements.selectStmt.get).toHaveBeenCalledWith(itemId);
        expect(mockDbStatements.deleteStmt.run).toHaveBeenCalledWith(itemId);
      });
    });

    describe('Edge cases', () => {
      it('should handle deletion with zero as item ID', async () => {
        // Arrange
        const itemId = '0';
        mockDbStatements.selectStmt.get.mockReturnValue(mockDbResponses.nonExistentItem);
        db.prepare.mockReturnValueOnce(mockDbStatements.selectStmt);

        // Act
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(404);

        // Assert
        expect(response.body.error).toBe('Item not found');
        expect(mockDbStatements.selectStmt.get).toHaveBeenCalledWith(itemId);
      });

      it('should handle deletion with negative item ID', async () => {
        // Arrange
        const itemId = '-1';
        mockDbStatements.selectStmt.get.mockReturnValue(mockDbResponses.nonExistentItem);
        db.prepare.mockReturnValueOnce(mockDbStatements.selectStmt);

        // Act
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(404);

        // Assert
        expect(response.body.error).toBe('Item not found');
        expect(mockDbStatements.selectStmt.get).toHaveBeenCalledWith(itemId);
      });

      it('should handle very large item ID', async () => {
        // Arrange
        const itemId = '999999999999999';
        mockDbStatements.selectStmt.get.mockReturnValue(mockDbResponses.nonExistentItem);
        db.prepare.mockReturnValueOnce(mockDbStatements.selectStmt);

        // Act
        const response = await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(404);

        // Assert
        expect(response.body.error).toBe('Item not found');
        expect(mockDbStatements.selectStmt.get).toHaveBeenCalledWith(itemId);
      });

      it('should handle item ID with special characters', async () => {
        // Arrange
        const itemId = '1@'; // Express URL-decodes '@#$%' to just '@'
        mockDbStatements.selectStmt.get.mockReturnValue(mockDbResponses.nonExistentItem);
        db.prepare.mockReturnValueOnce(mockDbStatements.selectStmt);

        // Act
        const response = await request(app)
          .delete('/api/items/1@#$%') // Original URL with special chars
          .expect(404);

        // Assert
        expect(response.body.error).toBe('Item not found');
        expect(mockDbStatements.selectStmt.get).toHaveBeenCalledWith(itemId);
      });
    });

    describe('Database interaction verification', () => {
      it('should call database methods in correct order for successful deletion', async () => {
        // Arrange
        const itemId = '1';
        const { selectStmt, deleteStmt } = setupDeleteMocks(true, true);

        // Act
        await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(200);

        // Assert
        expect(db.prepare).toHaveBeenCalledTimes(2);
        expect(db.prepare).toHaveBeenNthCalledWith(1, 'SELECT * FROM items WHERE id = ?');
        expect(db.prepare).toHaveBeenNthCalledWith(2, 'DELETE FROM items WHERE id = ?');
        expect(selectStmt.get).toHaveBeenCalledTimes(1);
        expect(selectStmt.get).toHaveBeenCalledWith(itemId);
        expect(deleteStmt.run).toHaveBeenCalledTimes(1);
        expect(deleteStmt.run).toHaveBeenCalledWith(itemId);
      });

      it('should not call DELETE statement when item does not exist', async () => {
        // Arrange
        const itemId = '999';
        mockDbStatements.selectStmt.get.mockReturnValue(mockDbResponses.nonExistentItem);
        db.prepare.mockReturnValueOnce(mockDbStatements.selectStmt);

        // Act
        await request(app)
          .delete(`/api/items/${itemId}`)
          .expect(404);

        // Assert
        expect(db.prepare).toHaveBeenCalledTimes(1);
        expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM items WHERE id = ?');
        expect(mockDbStatements.selectStmt.get).toHaveBeenCalledWith(itemId);
        // DELETE statement should not be prepared or executed
        expect(db.prepare).not.toHaveBeenCalledWith('DELETE FROM items WHERE id = ?');
      });
    });
  });

  describe('GET /api/items', () => {
    it('should return all items successfully', async () => {
      // Arrange
      const mockItems = [
        { id: 1, name: 'Test Item 1', created_at: '2025-07-09 10:00:00' },
        { id: 2, name: 'Test Item 2', created_at: '2025-07-09 11:00:00' }
      ];
      
      const mockGetAllStmt = {
        all: jest.fn().mockReturnValue(mockItems)
      };
      
      db.prepare.mockReturnValue(mockGetAllStmt);

      // Act
      const response = await request(app)
        .get('/api/items')
        .expect(200);

      // Assert
      expect(response.body).toEqual(mockItems);
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM items ORDER BY created_at DESC');
      expect(mockGetAllStmt.all).toHaveBeenCalled();
    });

    it('should return 500 when database query fails', async () => {
      // Arrange
      const mockGetAllStmt = {
        all: jest.fn().mockImplementation(() => {
          throw new Error('Database connection failed');
        })
      };
      
      db.prepare.mockReturnValue(mockGetAllStmt);

      // Act
      const response = await request(app)
        .get('/api/items')
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Failed to fetch items'
      });
      expect(mockConsole.error).toHaveBeenCalledWith('Error fetching items:', expect.any(Error));
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item successfully', async () => {
      // Arrange
      const newItemName = 'New Test Item';
      const mockInsertResult = { lastInsertRowid: 5 };
      const mockNewItem = { id: 5, name: newItemName, created_at: '2025-07-09 12:00:00' };
      
      const mockSelectStmt = {
        get: jest.fn().mockReturnValue(mockNewItem)
      };
      
      // Mock the global insertStmt
      insertStmt.run = jest.fn().mockReturnValue(mockInsertResult);
      
      // Mock the SELECT statement for getting the new item
      db.prepare.mockReturnValueOnce(mockSelectStmt);

      // Act
      const response = await request(app)
        .post('/api/items')
        .send({ name: newItemName })
        .expect(201);

      // Assert
      expect(response.body).toEqual(mockNewItem);
      expect(insertStmt.run).toHaveBeenCalledWith(newItemName);
      expect(mockSelectStmt.get).toHaveBeenCalledWith(5);
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM items WHERE id = ?');
    });

    it('should return 400 when name is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/items')
        .send({})
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        error: 'Item name is required'
      });
    });

    it('should return 400 when name is not a string', async () => {
      // Act
      const response = await request(app)
        .post('/api/items')
        .send({ name: 123 })
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        error: 'Item name is required'
      });
    });

    it('should return 400 when name is empty string', async () => {
      // Act
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        error: 'Item name is required'
      });
    });

    it('should return 400 when name is only whitespace', async () => {
      // Act
      const response = await request(app)
        .post('/api/items')
        .send({ name: '   ' })
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        error: 'Item name is required'
      });
    });

    it('should return 500 when database insert fails', async () => {
      // Arrange
      const newItemName = 'New Test Item';
      
      // Mock the global insertStmt to throw an error
      insertStmt.run = jest.fn().mockImplementation(() => {
        throw new Error('Database insert failed');
      });

      // Act
      const response = await request(app)
        .post('/api/items')
        .send({ name: newItemName })
        .expect(500);

      // Assert
      expect(response.body).toEqual({
        error: 'Failed to create item'
      });
      expect(mockConsole.error).toHaveBeenCalledWith('Error creating item:', expect.any(Error));
      expect(insertStmt.run).toHaveBeenCalledWith(newItemName);
    });
  });
});
