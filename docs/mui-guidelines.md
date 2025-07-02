# Material-UI (MUI) Guidelines

This document outlines the best practices and conventions for using Material-UI (MUI) in this project.

## Overview

Material-UI is a popular React UI framework that implements Google's Material Design. It provides a comprehensive set of pre-built components that are customizable and accessible.

## Installation

The project uses Material-UI v5. The core packages are already installed:

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

## Theme Configuration

### Project Theme

We use a custom theme to maintain consistent styling across the application. The theme is defined in `packages/frontend/src/theme.js`.

- Always use the theme's color palette, spacing, and typography settings
- Avoid hardcoded colors, font sizes, or spacing values
- Use the theme's breakpoints for responsive design

### Theme Usage

```javascript
import { useTheme } from '@mui/material/styles';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      padding: theme.spacing(2),
      backgroundColor: theme.palette.background.paper 
    }}>
      Content
    </Box>
  );
}
```

## Component Guidelines

### Preferred Components

Use these MUI components instead of HTML elements when possible:

- `<Box>` instead of `<div>`
- `<Typography>` instead of `<h1>`, `<p>`, etc.
- `<Button>` instead of `<button>`
- `<TextField>` instead of `<input>`
- `<Container>` for layout containers

### Layout Components

Use MUI's layout components for consistent spacing and alignment:

- `<Grid>` for responsive layouts
- `<Stack>` for one-dimensional layouts
- `<Box>` with `sx` prop for custom styling

### Styling Approaches

1. **Preferred: `sx` prop**

   ```javascript
   <Button 
     sx={{ 
       mt: 2, 
       px: 3,
       backgroundColor: 'primary.light',
       '&:hover': {
         backgroundColor: 'primary.main',
       }
     }}
   >
     Click Me
   </Button>
   ```

2. **Styled Components**

   ```javascript
   import { styled } from '@mui/material/styles';
   
   const CustomButton = styled(Button)(({ theme }) => ({
     marginTop: theme.spacing(2),
     paddingLeft: theme.spacing(3),
     paddingRight: theme.spacing(3),
     backgroundColor: theme.palette.primary.light,
     '&:hover': {
       backgroundColor: theme.palette.primary.main,
     },
   }));
   ```

3. **useStyles hook (for complex components)**

   ```javascript
   import { makeStyles } from '@mui/styles';
   
   const useStyles = makeStyles((theme) => ({
     root: {
       display: 'flex',
       flexDirection: 'column',
     },
     button: {
       marginTop: theme.spacing(2),
     },
   }));
   
   function MyComponent() {
     const classes = useStyles();
     return (
       <div className={classes.root}>
         <Button className={classes.button}>Click Me</Button>
       </div>
     );
   }
   ```

## Data Display

### Tables

Use MUI's `<Table>` components for displaying tabular data:

```javascript
import { 
  Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper 
} from '@mui/material';

function MyTable({ data }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

### Lists

Use MUI's `<List>` components for displaying lists:

```javascript
import { List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';

function MyList({ items }) {
  return (
    <List>
      {items.map((item) => (
        <ListItem key={item.id}>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary={item.name} secondary={item.description} />
        </ListItem>
      ))}
    </List>
  );
}
```

## Forms

Use MUI's form components for consistent styling and behavior:

```javascript
import { TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

function MyForm() {
  return (
    <form>
      <TextField 
        label="Name" 
        variant="outlined" 
        fullWidth 
        margin="normal" 
      />
      
      <FormControl fullWidth margin="normal">
        <InputLabel>Category</InputLabel>
        <Select>
          <MenuItem value="option1">Option 1</MenuItem>
          <MenuItem value="option2">Option 2</MenuItem>
        </Select>
      </FormControl>
      
      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        sx={{ mt: 2 }}
      >
        Submit
      </Button>
    </form>
  );
}
```

## Accessibility

- Use semantic MUI components that already implement accessibility features
- Include proper labels for form elements
- Ensure sufficient color contrast
- Test keyboard navigation for interactive elements
- Use `aria-*` attributes when needed

## Responsive Design

Use MUI's responsive utilities:

```javascript
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4}>
    {/* Content that takes full width on mobile, half on tablet, 1/3 on desktop */}
  </Grid>
</Grid>

<Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
  Responsive Text
</Typography>
```

## Performance Considerations

- Import components directly from their specific paths to enable tree-shaking:
  ```javascript
  // Good
  import Button from '@mui/material/Button';
  
  // Avoid
  import { Button } from '@mui/material';
  ```
- Use React.memo for complex components that re-render frequently
- Consider using virtualization for long lists/tables with `react-window` or `react-virtualized`

## Testing MUI Components

Use React Testing Library to test MUI components:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import MyComponent from './MyComponent';

test('renders correctly', () => {
  render(
    <ThemeProvider theme={theme}>
      <MyComponent />
    </ThemeProvider>
  );
  
  expect(screen.getByText('My Component')).toBeInTheDocument();
  
  fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));
  
  expect(screen.getByText('Clicked!')).toBeInTheDocument();
});
```

## Best Practices

1. **Consistent Component Usage**: Use the same variant and size for similar components
2. **Theme Extensions**: Extend the theme for custom props rather than creating one-off styles
3. **Component Composition**: Compose complex components from simpler MUI components
4. **Avoid Deep Nesting**: Keep component hierarchies shallow for better performance
5. **Lazy Loading**: Use dynamic imports for large components or views

## Common Issues and Solutions

### Theme Not Applied

Ensure components are wrapped with `ThemeProvider`.

### CSS-in-JS Performance

Consider using the `@emotion/cache` to optimize styling performance.

### Server-Side Rendering

For SSR applications, make sure to implement proper style extraction according to the MUI documentation.
