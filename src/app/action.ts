"use server";
export async function FetchSomeData() {
  return await fetch("https://jsonplaceholder.typicode.com/todos/1").then(
    (res) => res.json(),
  );
}
