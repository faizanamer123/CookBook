const fetchRecipe = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await fetch(`${API_URL}/recipes/${id}`);
    if (!response.ok) {
      throw new Error('Failed to load recipe');
    }
    
    const data = await response.json();
    if (!data) {
      throw new Error('Recipe not found');
    }
    
    setRecipe(data);
    
    // Fetch comments
    const commentsResponse = await fetch(`${API_URL}/recipes/${id}/comments`);
    if (commentsResponse.ok) {
      const commentsData = await commentsResponse.json();
      setComments(commentsData);
    }
  } catch (err) {
    console.error('Error fetching recipe:', err);
    setError(err.message || 'Failed to load recipe');
  } finally {
    setLoading(false);
  }
}; 