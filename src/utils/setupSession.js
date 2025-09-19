export const setupSession = (res, session) => {
  const { id, refreshToken, refreshTokenValidUntil } = session;
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'None',
    secure: process.env.NODE_ENV === 'production',
    expires: refreshTokenValidUntil,
  });
  res.cookie('sessionId', id, {
    httpOnly: true,
    sameSite: 'None',
    secure: process.env.NODE_ENV === 'production',
    expires: refreshTokenValidUntil,
  });
};
