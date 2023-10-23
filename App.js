import { useEffect, useRef, useState } from "react";
import { BounceLoader } from "react-spinners";
import StarList from "./StarList";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const apiKey = "7b7f0630";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState(
    JSON.parse(localStorage.getItem("myArray")) || []
  );

  // const [watched , setWatched]  = useState(function(){
  //   return JSON.parse(localStorage.getItem("myArray"))
  // })

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  function matchIdFunct(id) {
    setSelectedId((prevID) => (prevID === id ? null : id));
  }

  function handleDelete(id) {
    setWatched((prevArr) =>
      prevArr.filter((obj) => {
        return obj.imdbID !== id;
      })
    );
  }

  useEffect(() => {
    localStorage.setItem("myArray", JSON.stringify(watched));
  }, [watched]);

  useEffect(() => {
    setIsLoading(true);

    if (!query || query.length < 3) {
      setError("");
      setMovies([]);
      setIsLoading(false);

      return;
    }

    const controller = new AbortController();

    fetch(`http://www.omdbapi.com/?apikey=${apiKey}&s=${query}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("☠ Something is wrong with internet");
        }
        return res.json();
      })
      .then((data) => {
        if (data.Response === "False") {
          throw new Error("🧐 Movie not found");
        }
        setMovies(data.Search);
      })
      .catch((err) => {
        // console.error(err);
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return function () {
      controller.abort();
    };
  }, [query]);

  const override = {
    display: "block",
    margin: "20rem auto",
    borderColor: "red",
  };

  return (
    <>
      <NavBar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {error ? (
            <ErrorMessage error={error} />
          ) : isLoading ? (
            <BounceLoader
              loading={isLoading}
              color="red"
              size={75}
              cssOverride={override}
            />
          ) : (
            <MovieList movies={movies} matchIdFunct={matchIdFunct} />
          )}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetail
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              setWatched={setWatched}
              watched={watched}
            />
          ) : (
            <>
              <MovieWatchSummary watched={watched} />
              <MovieWatchedList watched={watched} handleDelete={handleDelete} />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function MovieDetail({ selectedId, setSelectedId, setWatched, watched }) {
  const [selectedFilm, setSelectedFilm] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");
  const isWatched = watched.map((obj) => obj.imdbID).includes(selectedId);
  const watchedSelectedRating = watched.find(
    (obj) => obj.imdbID === selectedId
  )?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = selectedFilm;

  const override = {
    display: "block",
    margin: "20rem auto",
    borderColor: "red",
  };

  function addToWatchList() {
    setWatched((prev) => {
      return [
        ...prev,
        {
          imdbID: selectedId,
          poster,
          title,
          imdbRating: Number(imdbRating),
          userRating: Number(userRating),
          runtime: Number(runtime.split(" ")[0]),
        },
      ];
    });

    setSelectedId(null);
  }

  useEffect(() => {
    setIsLoading(true);
    fetch(`http://www.omdbapi.com/?apikey=${apiKey}&i=${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedFilm(data);
        setIsLoading(false);
      });
  }, [selectedId]);

  useEffect(() => {
    document.title = `Title | ${title}`;

    return function () {
      document.title = "usePopecorn";
    };
  }, [title]);

  return (
    <div className="details">
      {isLoading ? (
        <BounceLoader
          loading={isLoading}
          color="red"
          size={75}
          cssOverride={override}
        />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={() => setSelectedId(null)}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${selectedFilm} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐️</span>
                {imdbRating} IMDb rating
              </p>
            </div>
          </header>

          <section>
            {isWatched ? (
              <p>You already rated it {watchedSelectedRating}</p>
            ) : (
              <div className="rating">
                <StarList
                  maxRating={10}
                  color="#fcc419"
                  size={20}
                  setUserRating={setUserRating}
                />
                <button className="btn-add" onClick={addToWatchList}>
                  + Add to list
                </button>
              </div>
            )}
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

// <div className="rating">
// {!isWatched ? (
//   <>
//     <StarRating
//       maxRating={10}
//       size={24}
//       onSetRating={setUserRating}
//     />
//     {userRating > 0 && (
//       <button className="btn-add" onClick={handleAdd}>
//         + Add to list
//       </button>
//     )}
//   </>
// ) : (
//   <p>
//     You rated with movie {watchedUserRating} <span>⭐️</span>
//   </p>
// )}
// </div>

function ErrorMessage({ error }) {
  return <p className="error">{error}</p>;
}

function NavBar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  useEffect(() => {
    document.addEventListener("keydown", function (e) {
      if (document.activeElement === inputEl.current) {
        return;
      }

      if (e.code === "Enter") {
        inputEl.current.focus();
        setQuery("");
      }
    });
  }, [setQuery]);

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen2, setIsOpen2] = useState(true);

  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen2((open) => !open)}
      >
        {isOpen2 ? "–" : "+"}
      </button>
      {isOpen2 && <>{children}</>}
    </div>
  );
}

function MovieWatchedList({ watched, handleDelete }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie movie={movie} handleDelete={handleDelete} />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, handleDelete }) {
  return (
    <li key={movie.imdbID}>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <WatchedMovieDescription icon="⭐️" rating={movie.imdbRating} />
        <WatchedMovieDescription icon="⭐️" rating={movie.userRating} />
        <WatchedMovieDescription
          icon="⏳"
          rating={movie.runtime}
          minute="min"
        />
      </div>
      <button className="btn-delete" onClick={() => handleDelete(movie.imdbID)}>
        X
      </button>
    </li>
  );
}

function WatchedMovieDescription({ icon, rating, minute }) {
  return (
    <p>
      <span>{icon}</span>
      <span>
        {rating} {minute && minute}
      </span>
    </p>
  );
}

function MovieWatchSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function MovieList({ movies, matchIdFunct }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} matchIdFunct={matchIdFunct} />
      ))}
    </ul>
  );
}

function Movie({ movie, matchIdFunct }) {
  return (
    <li onClick={() => matchIdFunct(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}
