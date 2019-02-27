// Adapted from https://github.com/MaxReinisch/isbn_archive_search/blob/master/app.js

(function() {
  function getQuery(isbn) {
    let clean_isbn = normalize(isbn);
    let isbn_10 = "";
    let isbn_13 = "";
    if (clean_isbn.length == 10) {
      // 10 => 13
      isbn_10 = clean_isbn;
      isbn_13 = getISBN13(isbn_10);
    } else if (clean_isbn.length == 13) {
      //13 => 10
      isbn_13 = clean_isbn;
      isbn_10 = getISBN10(isbn_13);
    } else {
      return null;
    }
    return formatQuery(isbn_10, isbn_13);
    //return query
  }

  function normalize(isbn) {
    let normalized = isbn.replace(/[^0-9Xx]+/g, "");
    return normalized.length != 9 ? normalized : "0" + normalized;
  }
  function getISBN10(isbn) {
    let isbn_no_check = isbn.slice(0, -1);
    if (isbn_no_check.slice(0, 3) != "978") {
      return false;
    }
    let isbn_9 = isbn_no_check.slice(3);
    return isbn_9 + checksum(isbn_9);
  }
  function getISBN13(isbn) {
    let isbn_no_check = isbn.slice(0, -1);
    let isbn_12 = "978" + isbn_no_check;
    return isbn_12 + checksum(isbn_12);
  }

  function checksum(isbn) {
    let sum = 0;
    if (isbn.length == 9) {
      //10
      for (let i = 0; i < 9; i++) {
        sum += (i + 1) * isbn[i];
      }
      let check = sum % 11;
      return check == 10 ? "X" : check;
    }
    if (isbn.length == 12) {
      //13
      for (let i = 0, k = 1; i < 12; i++, k = 4 - k) {
        sum += isbn[i] * k;
      }
      return (10 - (sum % 10)) % 10;
    } else {
      return;
    }
  }
  function formatQuery(isbn10, isbn13) {
    return (
      "mediatype:texts AND (isbn:" +
      isbn10 +
      " OR isbn:" +
      isbn13 +
      ' OR related-external-id:"urn:isbn:' +
      isbn10 +
      '" OR related-external-id:"urn:isbn:' +
      isbn13 +
      '")'
    );
  }

  function getURL(isbn) {
    const query = getQuery(isbn);
    return (
      "https://archive.org/advancedsearch.php?q=" +
      query +
      "&fl%5B%5D=identifier&sort%5B%5D=&sort%5B%5D=&sort%5B%5D=&rows=50&page=1&output=json&save=yes"
    );
  }

  // lifted from https://medium.freecodecamp.org/understanding-memoize-in-javascript-51d07d19430e
  const memoize = fn => {
    let cache = {};
    return (...args) => {
      let n = args[0]; // just taking one argument here
      if (n in cache) {
        console.log("Fetching from cache");
        return cache[n];
      } else {
        console.log("Calculating result");
        let result = fn(n);
        cache[n] = result;
        return result;
      }
    };
  };

  // HACK: export
  window.isbnToArchiveID = memoize(function(isbn) {
    return fetch(getURL(isbn))
      .then(function(response) {
        return response.json();
      })
      .then(function(result) {
        if (
          !result ||
          !result.response ||
          !result.response.docs ||
          !result.response.docs[0]
        ) {
          return null;
        }
        return result.response.docs[0].identifier;
      });
  });
})();
