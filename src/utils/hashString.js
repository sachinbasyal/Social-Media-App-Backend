import bcrypt from "bcrypt";

export const hashString = async(string) => {

  const salt = await bcrypt.genSalt(10);
  const hassedPassword = await bcrypt.hash(string, salt);
  return hassedPassword
}

export const compareString = async(password, dbPassword) => {
  const isPasswordValid = await bcrypt.compare(password, dbPassword);
  return isPasswordValid
}