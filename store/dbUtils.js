import * as SQLite from "expo-sqlite";

export const database = SQLite.openDatabase("dictionary.db");

export function init() {
  return new Promise((resolve, reject) => {
    database.transaction(
      (tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS words (
            word TEXT PRIMARY KEY NOT NULL,
            data TEXT NOT NULL
          );`,
        );

        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS theme (
            id INTEGER PRIMARY KEY NOT NULL,
            isDark INTEGER NOT NULL
          );`,
        );

        tx.executeSql(
          `INSERT OR IGNORE INTO theme (id, isDark)
           VALUES (1, 1);`,
        );
      },
      (error) => reject(error),
      () => resolve(),
    );
  });
}

export function addWord(word) {
  return executeWrite(
    `INSERT OR REPLACE INTO words (word, data)
     VALUES (?, ?);`,
    [word.word, JSON.stringify(word)],
  );
}

export function updateWord(word) {
  return executeWrite(`UPDATE words SET data = ? WHERE word = ?;`, [
    JSON.stringify(word),
    word.word,
  ]);
}

export function deleteWord(wordText) {
  return executeWrite(`DELETE FROM words WHERE word = ?;`, [wordText]);
}

export function getWords() {
  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        `SELECT data FROM words;`,
        [],
        (_, result) => {
          const words = result.rows._array.map((row) => JSON.parse(row.data));

          resolve(words);
        },
        (_, error) => {
          reject(error);
          return false;
        },
      );
    }, reject);
  });
}

export function getTheme() {
  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        `SELECT isDark FROM theme WHERE id = 1;`,
        [],
        (_, result) => {
          resolve(
            result.rows.length > 0 ? Boolean(result.rows.item(0).isDark) : true,
          );
        },
        (_, error) => {
          reject(error);
          return false;
        },
      );
    }, reject);
  });
}

export function setTheme(isDark) {
  return executeWrite(
    `INSERT OR REPLACE INTO theme (id, isDark)
     VALUES (1, ?);`,
    [isDark ? 1 : 0],
  );
}

function executeWrite(sql, params = []) {
  return new Promise((resolve, reject) => {
    database.transaction(
      (tx) => {
        tx.executeSql(
          sql,
          params,
          () => {},
          (_, error) => {
            reject(error);
            return false;
          },
        );
      },
      (error) => reject(error),
      () => resolve(),
    );
  });
}
