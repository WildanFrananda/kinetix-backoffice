import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { createCategoryCall } from "../../api/calls/create_category_call"
import { deleteCategoryCall } from "../../api/calls/delete_category_call"
import { updateCategoryCall } from "../../api/calls/update_category_call"
import { fieldError } from "../../i18n/field_error"
import { formatText } from "../../i18n/format_text"
import type { Category } from "../../types/category.type"
import type { CategoryDraft } from "../../types/category_draft.type"
import type { CategoryReport } from "../../types/category_report.type"
import { Button } from "../../ui/Button"
import { ArrowUUpLeft } from "../../ui/icons/ArrowUUpLeft"
import { Check } from "../../ui/icons/Check"
import { Plus } from "../../ui/icons/Plus"
import { Tag } from "../../ui/icons/Tag"
import { Trash } from "../../ui/icons/Trash"
import { Notice } from "../../ui/Notice"
import { TextField } from "../../ui/TextField"
import styles from "./Categories.module.css"
import { categoriesKey } from "./categories_queries"
import { useCategoriesText } from "./categories_text"
import { categoryFailure } from "./category_failure"
import { withCategory, withoutCategory } from "./category_order"
import { nameSchema, slugSchema } from "./category_rules"
import { DeleteCategoryDialog } from "./DeleteCategoryDialog"
import { slugOf } from "./slug_of"

function isGone(error: unknown): boolean {
  return error instanceof BffError && error.failure.kind === "refused" && error.failure.status === 404
}

function CategoryEditor({
  category,
  deleteRequest,
  onDone,
  onCancel
}: {
  category: Category | null
  deleteRequest: number
  onDone: (report: CategoryReport) => void
  onCancel: () => void
}) {
  const text = useCategoriesText()
  const queryClient = useQueryClient()
  const [slugFollowsName, setSlugFollowsName] = useState(category === null)
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    if (deleteRequest > 0 && category !== null) {
      setAsking(true)
    }
  }, [deleteRequest, category])

  function refreshOnGone(error: unknown): void {
    if (isGone(error)) {
      void queryClient.invalidateQueries({ queryKey: categoriesKey })
    }
  }

  const save = useMutation({
    mutationFn: (draft: CategoryDraft) =>
      bffFetch(category === null ? createCategoryCall(draft) : updateCategoryCall(category.id, draft)),
    onSuccess: (saved) => {
      queryClient.setQueryData<Category[]>(categoriesKey, (list) =>
        list === undefined ? list : withCategory(list, saved)
      )

      void queryClient.invalidateQueries({ queryKey: categoriesKey })
      form.reset({ name: saved.name, slug: saved.slug })
      onDone({ kind: category === null ? "created" : "saved", id: saved.id, name: saved.name })
    },
    onError: refreshOnGone
  })

  const remove = useMutation({
    mutationFn: (id: number) => bffFetch(deleteCategoryCall(id)),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Category[]>(categoriesKey, (list) =>
        list === undefined ? list : withoutCategory(list, id)
      )

      void queryClient.invalidateQueries({ queryKey: categoriesKey })
      setAsking(false)
      onDone({ kind: "deleted", id, name: category?.name ?? "" })
    },
    onError: refreshOnGone
  })

  const form = useForm({
    defaultValues: { name: category?.name ?? "", slug: category?.slug ?? "" },
    onSubmit: ({ value }) => {
      save.mutate({ name: value.name.trim(), slug: value.slug })
    }
  })

  const creating = category === null
  const saveFailure = save.error instanceof BffError ? categoryFailure(save.error.failure, text) : null
  const deleteFailure = remove.error instanceof BffError ? categoryFailure(remove.error.failure, text) : null

  return (
    <article className={styles.editor} aria-labelledby="category-title">
      <header className={styles.editorHead}>
        <p className={styles.kicker}>
          <Tag aria-hidden="true" />
          {creating
            ? text["categories.eyebrow"]
            : formatText(text["categories.kicker"], { number: String(category.id) })}
        </p>
        <h2 id="category-title" className={styles.editorTitle}>
          {creating ? text["categories.create.title"] : category.name}
        </h2>
        {creating ? <p className={styles.editorLead}>{text["categories.create.lead"]}</p> : null}
      </header>
      <form
        noValidate
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Field
          name="name"
          validators={{ onSubmit: nameSchema, onBlur: nameSchema }}
          listeners={{
            onChange: ({ value }) => {
              if (slugFollowsName) {
                form.setFieldValue("slug", slugOf(value))
              }
            }
          }}
        >
          {(field) => (
            <TextField
              label={text["categories.field.name"]}
              description={text["categories.field.nameHint"]}
              name={field.name}
              autoComplete="off"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta.errors, text)}
              validationBehavior="aria"
              isRequired
            />
          )}
        </form.Field>
        <form.Field name="slug" validators={{ onSubmit: slugSchema, onBlur: slugSchema }}>
          {(field) => (
            <TextField
              label={text["categories.field.slug"]}
              description={text["categories.field.slugHint"]}
              name={field.name}
              autoComplete="off"
              mono
              value={field.state.value}
              onChange={(value) => {
                setSlugFollowsName(false)
                field.handleChange(value)
              }}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta.errors, text)}
              validationBehavior="aria"
              isRequired
            />
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.values}>
          {(values) => {
            const slugMoved = !creating && values.slug !== category.slug
            const changed = creating || slugMoved || values.name.trim() !== category.name

            return (
              <>
                {slugMoved ? (
                  <Notice tone="info">
                    {formatText(text["categories.edit.slugWarning"], { slug: category.slug })}
                  </Notice>
                ) : null}
                {!creating && changed ? <p className={styles.note}>{text["categories.edit.searchNote"]}</p> : null}
                {saveFailure === null ? null : (
                  <Notice tone="problem">
                    {saveFailure.lead}
                    {saveFailure.quote === null ? null : (
                      <q className={styles.quote} lang="en">
                        {saveFailure.quote}
                      </q>
                    )}
                  </Notice>
                )}
                <div className={styles.formActions}>
                  <Button type="submit" isDisabled={save.isPending || !changed}>
                    {creating ? <Plus aria-hidden="true" /> : <Check aria-hidden="true" />}
                    {save.isPending
                      ? text[creating ? "categories.create.submitting" : "categories.edit.submitting"]
                      : text[creating ? "categories.create.submit" : "categories.edit.submit"]}
                  </Button>
                  {creating ? (
                    <Button variant="secondary" isDisabled={save.isPending} onPress={onCancel}>
                      {text["categories.cancel"]}
                    </Button>
                  ) : (
                    <Button
                      variant="quiet"
                      isDisabled={save.isPending || !changed}
                      onPress={() => {
                        save.reset()
                        form.reset()
                      }}
                    >
                      <ArrowUUpLeft aria-hidden="true" />
                      {text["categories.edit.reset"]}
                    </Button>
                  )}
                </div>
              </>
            )
          }}
        </form.Subscribe>
      </form>
      {creating ? null : (
        <section className={styles.danger} aria-labelledby="delete-title">
          <h3 id="delete-title" className={styles.sectionTitle}>
            {text["categories.delete.section"]}
          </h3>
          <p className={styles.dangerBody}>{text["categories.delete.body"]}</p>
          <div>
            <Button
              variant="secondary"
              onPress={() => {
                remove.reset()
                setAsking(true)
              }}
            >
              <Trash aria-hidden="true" />
              {text["categories.delete.open"]}
            </Button>
          </div>
          <DeleteCategoryDialog
            open={asking}
            name={category.name}
            pending={remove.isPending}
            failure={deleteFailure}
            onConfirm={() => remove.mutate(category.id)}
            onClose={() => setAsking(false)}
          />
        </section>
      )}
    </article>
  )
}

export { CategoryEditor }
