export const generatePassword = () => {
    const allCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{12}$/;

    let randomPassword = '';

    do {
        randomPassword = Array.from({ length: 12 }, () => {
            const randomIndex = window.crypto.getRandomValues(new Uint32Array(1))[0] % allCharacters.length;
            return allCharacters[randomIndex];
        }).join('');
    } while (!regex.test(randomPassword));

    return randomPassword;
};
