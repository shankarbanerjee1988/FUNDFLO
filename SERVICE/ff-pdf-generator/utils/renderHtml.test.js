const renderHtml = require('../utils/renderHtml');

describe('renderHtml', () => {
  test('renders basic template correctly', () => {
    const template = '<h1>{{title}}</h1><p>{{content}}</p>';
    const data = { title: 'Test Title', content: 'Test Content' };
    
    const result = renderHtml(template, data);
    
    expect(result).toContain('<h1>Test Title</h1>');
    expect(result).toContain('<p>Test Content</p>');
  });
  
  test('handles markdown content', () => {
    const template = '{{markdown content}}';
    const data = { content: '# Heading\n\nParagraph' };
    
    const result = renderHtml(template, data);
    
    expect(result).toContain('<h1>Heading</h1>');
    expect(result).toContain('<p>Paragraph</p>');
  });
  
  test('handles jsonTable helper', () => {
    const template = '{{jsonTable items}}';
    const data = { 
      items: [
        { name: 'Item 1', value: 10 },
        { name: 'Item 2', value: 20 }
      ] 
    };
    
    const result = renderHtml(template, data);
    
    expect(result).toContain('<table');
    expect(result).toContain('<th>name</th>');
    expect(result).toContain('<th>value</th>');
    expect(result).toContain('<td>Item 1</td>');
    expect(result).toContain('<td>10</td>');
  });
});