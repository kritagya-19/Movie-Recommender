import pandas as pd

movies = pd.read_csv('../dataset/data/movies.csv')
netflix = pd.read_csv('../dataset/data/netflix_titles.csv')
kdrama = pd.read_csv('../dataset/data/kdrama.csv')
movies = movies[['title', 'genres', 'overview']]
movies['type'] = 'movie'

netflix = netflix[['title', 'listed_in', 'description']]
netflix.columns = ['title', 'genres', 'overview']
netflix['type'] = 'webseries'

kdrama = kdrama[['Name', 'Genre', 'Synopsis']]
kdrama.columns = ['title', 'genres', 'overview']
kdrama['type'] = 'kdrama'

final = pd.concat([movies, netflix, kdrama], ignore_index=True)

final.dropna(inplace=True)
final.drop_duplicates(subset='title', inplace=True)

final['tags'] = final['overview'] + " " + final['genres']

final.to_csv('../dataset/final_dataset.csv', index=False)

print("Final dataset created successfully!")