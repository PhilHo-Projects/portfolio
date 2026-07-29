export function readRequestedResumeId(href) {
  return new URL(href).searchParams.get('cv');
}

export function resolveResumeId(requestedId, registry) {
  return registry.resumes.some(({ id }) => id === requestedId)
    ? requestedId
    : registry.defaultResumeId;
}

export function resumeUrlForId(href, id) {
  const url = new URL(href);
  url.searchParams.set('cv', id);
  return url.toString();
}
