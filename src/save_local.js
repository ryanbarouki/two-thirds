import { DateTime } from "luxon";

export const loadUsernames = () => {
    const storedUsernames = localStorage.getItem("usernames");
    return storedUsernames != null ? JSON.parse(storedUsernames) : {};
};

export const saveUsername = (dayString, username) => {
    const allUsernames = loadUsernames();
    localStorage.setItem(
        "usernames",
        JSON.stringify({
            ...allUsernames,
            [dayString]: username,
        })
    );
};

export const getYesterdaysUsername = () => {
    const yesterday = DateTime.now().minus({days: 1}).toFormat("yyyy-MM-dd");
    return loadUsernames()[yesterday] ?? '';
};

export const getTodaysUsername = () => {
    const today = DateTime.now().toFormat("yyyy-MM-dd");
    return loadUsernames()[today] ?? '';
};

export const getDayString = () => {
  return DateTime.now().toFormat("yyyy-MM-dd");
};