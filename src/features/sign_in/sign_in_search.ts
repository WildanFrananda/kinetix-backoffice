import * as v from "valibot"

const signInSearch = v.object({
  redirect: v.optional(v.pipe(v.string(), v.maxLength(2048))),
  notice: v.optional(v.picklist(["session-ended", "signed-out", "role-refused"]))
})

export { signInSearch }
