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

export const getUsername = (dayString) => {
    return loadUsernames()[dayString] ?? '';
};