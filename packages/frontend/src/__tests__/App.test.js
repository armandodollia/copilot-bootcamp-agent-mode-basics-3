import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Test data and constants
const MOCK_ITEMS = [
  { id: 1, name: 'Test Item 1' },
  { id: 2, name: 'Test Item 2' }
];

const MOCK_NEW_ITEM = { id: 3, name: 'New Test Item' };

// Mock fetch function
global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    console.error = jest.fn(); // Mock console.error to avoid test output noise
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test outline for 100% branch coverage:
  
  // 1. Component rendering tests
  // - Should render basic structure and static content
  // - Should show loading state initially
  
  // 2. Data fetching tests (fetchData function)
  // - Should fetch data successfully on mount
  // - Should handle fetch error and display error message
  // - Should handle non-ok response status
  
  // 3. Add item functionality tests (handleSubmit function)
  // - Should add new item successfully
  // - Should not submit empty/whitespace-only items
  // - Should handle add item API error
  // - Should clear input field after successful add
  
  // 4. Delete item functionality tests (handleDelete function)
  // - Should delete item successfully
  // - Should handle delete API error
  // - Should show loading state during delete
  // - Should handle non-ok response status for delete
  
  // 5. UI state tests
  // - Should display items table when data exists
  // - Should display "No items found" message when no data
  // - Should display error alert when error exists
  // - Should disable delete button while deleting
  // - Should update input field value on change

  // Empty test placeholders (disabled)
  
  describe('Component Rendering', () => {
    it('should render basic structure and static content', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_ITEMS
      });

      // Act
      render(<App />);

      // Assert
      expect(screen.getByText('Hello World')).toBeInTheDocument();
      expect(screen.getByText('Connected to in-memory database')).toBeInTheDocument();
      expect(screen.getByText('Add New Item')).toBeInTheDocument();
      expect(screen.getByText('Items from Database')).toBeInTheDocument();
      expect(screen.getByLabelText('Item Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      // Arrange
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      render(<App />);

      // Assert
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch data successfully on mount', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_ITEMS
      });

      // Act
      render(<App />);

      // Assert
      expect(fetch).toHaveBeenCalledWith('/api/items');
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
        expect(screen.getByText('Test Item 2')).toBeInTheDocument();
      });
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should handle fetch error and display error message', async () => {
      // Arrange
      const errorMessage = 'Network error';
      fetch.mockRejectedValueOnce(new Error(errorMessage));

      // Act
      render(<App />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(`Failed to fetch data: ${errorMessage}`)).toBeInTheDocument();
      });
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
    });

    it('should handle non-ok response status', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      // Act
      render(<App />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch data: Network response was not ok')).toBeInTheDocument();
      });
      expect(console.error).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
    });
  });

  describe('Add Item Functionality', () => {
    it('should add new item successfully', async () => {
      // Arrange
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_ITEMS
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_NEW_ITEM
        });

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Item Name');
      const submitButton = screen.getByRole('button', { name: 'Add Item' });

      // Act
      fireEvent.change(input, { target: { value: 'New Test Item' } });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'New Test Item' }),
        });
      });

      await waitFor(() => {
        expect(screen.getByText('New Test Item')).toBeInTheDocument();
      });
    });

    it('should not submit empty or whitespace-only items', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const input = screen.getByLabelText('Item Name');
      const submitButton = screen.getByRole('button', { name: 'Add Item' });

      // Act - Test empty string
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.click(submitButton);

      // Assert
      expect(fetch).toHaveBeenCalledTimes(1); // Only initial fetch

      // Act - Test whitespace only
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(submitButton);

      // Assert
      expect(fetch).toHaveBeenCalledTimes(1); // Still only initial fetch
    });

    it('should handle add item API error', async () => {
      // Arrange
      const errorMessage = 'Add item failed';
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_ITEMS
        })
        .mockRejectedValueOnce(new Error(errorMessage));

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Item Name');
      const submitButton = screen.getByRole('button', { name: 'Add Item' });

      // Act
      fireEvent.change(input, { target: { value: 'New Item' } });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(`Error adding item: ${errorMessage}`)).toBeInTheDocument();
      });
      expect(console.error).toHaveBeenCalledWith('Error adding item:', expect.any(Error));
    });

    it('should handle non-ok response status for add item', async () => {
      // Arrange
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_ITEMS
        })
        .mockResolvedValueOnce({
          ok: false
        });

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Item Name');
      const submitButton = screen.getByRole('button', { name: 'Add Item' });

      // Act
      fireEvent.change(input, { target: { value: 'New Item' } });
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error adding item: Failed to add item')).toBeInTheDocument();
      });
      expect(console.error).toHaveBeenCalledWith('Error adding item:', expect.any(Error));
    });

    it('should clear input field after successful add', async () => {
      // Arrange
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => []
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_NEW_ITEM
        });

      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const input = screen.getByLabelText('Item Name');
      const submitButton = screen.getByRole('button', { name: 'Add Item' });

      // Act
      fireEvent.change(input, { target: { value: 'New Test Item' } });
      expect(input.value).toBe('New Test Item');
      
      fireEvent.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Delete Item Functionality', () => {
    it('should delete item successfully', async () => {
      // Arrange
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_ITEMS
        })
        .mockResolvedValueOnce({
          ok: true
        });

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
        expect(screen.getByText('Test Item 2')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');

      // Act
      fireEvent.click(deleteButtons[0]);

      // Assert
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/items/1', {
          method: 'DELETE',
        });
      });

      await waitFor(() => {
        expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
        expect(screen.getByText('Test Item 2')).toBeInTheDocument();
      });
    });

    it('should handle delete API error', async () => {
      // Arrange
      const errorMessage = 'Delete failed';
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_ITEMS
        })
        .mockRejectedValueOnce(new Error(errorMessage));

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');

      // Act
      fireEvent.click(deleteButtons[0]);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(`Error deleting item: ${errorMessage}`)).toBeInTheDocument();
      });
      expect(console.error).toHaveBeenCalledWith('Error deleting item:', expect.any(Error));
      
      // Table should be hidden when error is shown (based on the condition !loading && !error)
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
    });

    it('should show loading state during delete', async () => {
      // Arrange
      let resolveDelete;
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve;
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_ITEMS
        })
        .mockReturnValueOnce(deletePromise);

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');

      // Act
      fireEvent.click(deleteButtons[0]);

      // Assert - Should show "Deleting..." text
      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument();
      });

      // Complete the delete operation
      resolveDelete({
        ok: true
      });

      await waitFor(() => {
        expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
      });
    });

    it('should handle non-ok response status for delete', async () => {
      // Arrange
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_ITEMS
        })
        .mockResolvedValueOnce({
          ok: false
        });

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');

      // Act
      fireEvent.click(deleteButtons[0]);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error deleting item: Failed to delete item')).toBeInTheDocument();
      });
      expect(console.error).toHaveBeenCalledWith('Error deleting item:', expect.any(Error));
      
      // Table should be hidden when error is shown (based on the condition !loading && !error)
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
    });
  });

  describe('UI State Management', () => {
    it('should display items table when data exists', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_ITEMS
      });

      // Act
      render(<App />);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('table', { name: 'items table' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Item Name' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
        expect(screen.getByText('Test Item 2')).toBeInTheDocument();
        expect(screen.getAllByText('Delete')).toHaveLength(2);
      });
    });

    it('should display no items message when data is empty', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      // Act
      render(<App />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('No items found. Add some!')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
      });
    });

    it('should display error alert when error exists', async () => {
      // Arrange
      const errorMessage = 'Test error message';
      fetch.mockRejectedValueOnce(new Error(errorMessage));

      // Act
      render(<App />);

      // Assert
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(`Failed to fetch data: ${errorMessage}`);
      });
    });

    it('should disable delete button while deleting', async () => {
      // Arrange
      let resolveDelete;
      const deletePromise = new Promise((resolve) => {
        resolveDelete = resolve;
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => MOCK_ITEMS
        })
        .mockReturnValueOnce(deletePromise);

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');

      // Act
      fireEvent.click(deleteButtons[0]);

      // Assert - First button should be disabled and show "Deleting..."
      await waitFor(() => {
        const deletingButton = screen.getByText('Deleting...');
        expect(deletingButton).toBeDisabled();
      });

      // Other delete buttons should still be enabled
      const remainingDeleteButtons = screen.getAllByText('Delete');
      expect(remainingDeleteButtons[0]).not.toBeDisabled();

      // Complete the delete operation
      resolveDelete({
        ok: true
      });

      await waitFor(() => {
        expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
      });
    });

    it('should update input field value on change', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      render(<App />);
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const input = screen.getByLabelText('Item Name');

      // Act
      fireEvent.change(input, { target: { value: 'Test Input Value' } });

      // Assert
      expect(input.value).toBe('Test Input Value');

      // Act - Change again
      fireEvent.change(input, { target: { value: 'Updated Value' } });

      // Assert
      expect(input.value).toBe('Updated Value');
    });
  });
});
