import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load combined dataset
movies = pd.read_csv('../dataset/final_dataset.csv')

# Fill missing (safety)
movies.fillna('', inplace=True)

# Convert text to vectors
cv = CountVectorizer(max_features=5000, stop_words='english')
vectors = cv.fit_transform(movies['tags']).toarray()

# Similarity matrix
similarity = cosine_similarity(vectors)

def recommend(movie):
    movie = movie.lower()
    
    if movie not in movies['title'].str.lower().values:
        return ["Movie not found"]
    
    index = movies[movies['title'].str.lower() == movie].index[0]
    distances = similarity[index]
    
    movie_list = sorted(list(enumerate(distances)),
                        reverse=True,
                        key=lambda x: x[1])[1:6]
    
    results = []
    for i in movie_list:
        title = movies.iloc[i[0]].title
        type_ = movies.iloc[i[0]].type
        results.append(f"{title} ({type_})")
    
    return results