import { z } from "zod";

export const editorialChartVariants = [
  "horizontal-bar",
  "vertical-bar",
  "grouped-bar",
  "stacked-bar",
  "line",
  "area",
  "dot-plot",
  "lollipop",
  "bullet",
  "slope",
  "waterfall"
] as const;

export const advancedChartVariants = [
  "scatter",
  "bubble",
  "histogram",
  "box-plot",
  "heatmap",
  "calendar-heatmap",
  "donut",
  "waffle",
  "treemap",
  "sunburst",
  "funnel",
  "sankey",
  "radar",
  "gauge",
  "gantt",
  "timeline",
  "small-multiples",
  "choropleth",
  "proportional-symbol-map"
] as const;

export const ChartVariantSchema = z.enum([
  ...editorialChartVariants,
  ...advancedChartVariants
]);
export type ChartVariant = z.infer<typeof ChartVariantSchema>;

export const ChartDatumSchema = z
  .object({
    id: z.string().trim().min(1),
    category: z.string().trim().min(1).optional(),
    value: z.number().finite().nullable().optional(),
    target: z.number().finite().nullable().optional(),
    series: z.string().trim().min(1).optional(),
    x: z.union([z.number().finite(), z.string().trim().min(1)]).optional(),
    y: z.number().finite().nullable().optional(),
    size: z.number().finite().nonnegative().optional(),
    low: z.number().finite().optional(),
    high: z.number().finite().optional(),
    source: z.string().trim().min(1).optional(),
    targetNode: z.string().trim().min(1).optional(),
    start: z.union([z.number().finite(), z.string().trim().min(1)]).optional(),
    end: z.union([z.number().finite(), z.string().trim().min(1)]).optional(),
    date: z.string().trim().min(1).optional(),
    geographyKey: z.string().trim().min(1).optional(),
    parentId: z.string().trim().min(1).optional(),
    role: z.enum(["total", "delta"]).optional()
  })
  .strict();
export type ChartDatum = z.infer<typeof ChartDatumSchema>;

export const ChartEncodingSchema = z
  .object({
    categoryField: z.string().trim().min(1).optional(),
    valueField: z.string().trim().min(1).optional(),
    targetField: z.string().trim().min(1).optional(),
    seriesField: z.string().trim().min(1).optional(),
    xField: z.string().trim().min(1).optional(),
    yField: z.string().trim().min(1).optional(),
    sizeField: z.string().trim().min(1).optional(),
    sourceField: z.string().trim().min(1).optional(),
    targetNodeField: z.string().trim().min(1).optional(),
    startField: z.string().trim().min(1).optional(),
    endField: z.string().trim().min(1).optional(),
    dateField: z.string().trim().min(1).optional(),
    geographyField: z.string().trim().min(1).optional(),
    zeroBaseline: z.boolean().optional()
  })
  .strict();
export type ChartEncoding = z.infer<typeof ChartEncodingSchema>;

export const NumberFormatSpecSchema = z
  .object({
    style: z.enum(["decimal", "percent", "currency", "compact"]),
    currency: z.string().trim().length(3).optional(),
    minimumFractionDigits: z.number().int().min(0).max(20).optional(),
    maximumFractionDigits: z.number().int().min(0).max(20),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    missingLabel: z.string().optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.style === "currency" && !value.currency) {
      context.addIssue({
        code: "custom",
        path: ["currency"],
        message: "Currency number format requires a three-letter currency code."
      });
    }
    if (
      value.minimumFractionDigits !== undefined &&
      value.minimumFractionDigits > value.maximumFractionDigits
    ) {
      context.addIssue({
        code: "custom",
        path: ["minimumFractionDigits"],
        message: "minimumFractionDigits cannot exceed maximumFractionDigits."
      });
    }
  });
export type NumberFormatSpec = z.infer<typeof NumberFormatSpecSchema>;

export const DirectLabelPolicySchema = z
  .object({
    mode: z.enum(["direct", "legend", "none"]),
    showValues: z.boolean(),
    collisionPolicy: z.enum(["diagnose", "hide-secondary", "wrap"])
  })
  .strict();
export type DirectLabelPolicy = z.infer<typeof DirectLabelPolicySchema>;

export const ChartHighlightSchema = z
  .object({
    datumId: z.string().trim().min(1),
    level: z.enum(["primary", "secondary"]),
    label: z.string().trim().min(1).optional()
  })
  .strict();
export type ChartHighlight = z.infer<typeof ChartHighlightSchema>;

export const ChartAnnotationSchema = z
  .object({
    id: z.string().trim().min(1),
    text: z.string().trim().min(1),
    datumId: z.string().trim().min(1).optional(),
    x: z.number().finite().optional(),
    y: z.number().finite().optional()
  })
  .strict();
export type ChartAnnotation = z.infer<typeof ChartAnnotationSchema>;

export const ChartReferenceLineSchema = z
  .object({
    id: z.string().trim().min(1),
    label: z.string().trim().min(1),
    value: z.number().finite(),
    axis: z.enum(["x", "y"])
  })
  .strict();
export type ChartReferenceLine = z.infer<typeof ChartReferenceLineSchema>;

export const ChartEvidenceSchema = z
  .object({
    status: z.enum(["verified", "unverified", "illustrative", "stale"]),
    sourceIds: z.array(z.string().trim().min(1)),
    label: z.string().trim().min(1).optional(),
    period: z.string().trim().min(1).optional(),
    sample: z.string().trim().min(1).optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "illustrative" && !value.label) {
      context.addIssue({
        code: "custom",
        path: ["label"],
        message: "Illustrative chart evidence requires a visible illustrative label."
      });
    }
    if (value.status !== "illustrative" && value.sourceIds.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["sourceIds"],
        message: "Non-illustrative chart evidence requires at least one source ID."
      });
    }
  });
export type ChartEvidence = z.infer<typeof ChartEvidenceSchema>;

export const ChartAnimationPolicySchema = z
  .object({
    mode: z.enum(["none", "fade", "zero-to-value", "trace"]),
    durationMs: z.number().int().min(0).max(5000)
  })
  .strict();
export type ChartAnimationPolicy = z.infer<typeof ChartAnimationPolicySchema>;

const ZERO_BASELINE_VARIANTS = new Set<ChartVariant>([
  "horizontal-bar",
  "vertical-bar",
  "grouped-bar",
  "stacked-bar",
  "lollipop",
  "bullet",
  "waterfall"
]);

const CATEGORY_VALUE_VARIANTS = new Set<ChartVariant>([
  "horizontal-bar",
  "vertical-bar",
  "grouped-bar",
  "stacked-bar",
  "line",
  "area",
  "dot-plot",
  "lollipop",
  "bullet",
  "slope",
  "waterfall",
  "donut",
  "waffle",
  "treemap",
  "sunburst",
  "funnel",
  "radar",
  "gauge",
  "small-multiples"
]);

function addDataIssue(
  context: z.RefinementCtx,
  datumIndex: number,
  message: string
): void {
  context.addIssue({
    code: "custom",
    path: ["data", datumIndex],
    message
  });
}

export const ChartSpecSchema = z
  .object({
    question: z.string().trim().min(1),
    title: z.string().trim().min(1),
    accessibleSummary: z.string().trim().min(1),
    variant: ChartVariantSchema,
    data: z.array(ChartDatumSchema).min(1),
    encoding: ChartEncodingSchema,
    unit: z.string().trim().min(1),
    numberFormat: NumberFormatSpecSchema,
    labels: DirectLabelPolicySchema,
    highlights: z.array(ChartHighlightSchema),
    annotations: z.array(ChartAnnotationSchema),
    referenceLines: z.array(ChartReferenceLineSchema),
    evidence: ChartEvidenceSchema,
    missingValuePolicy: z.enum(["gap", "zero", "omit"]),
    animation: ChartAnimationPolicySchema,
    localGeoAssetId: z.string().trim().min(1).optional()
  })
  .strict()
  .superRefine((spec, context) => {
    const primaryHighlights = spec.highlights.filter(
      (highlight) => highlight.level === "primary"
    );
    if (primaryHighlights.length > 1) {
      context.addIssue({
        code: "custom",
        path: ["highlights"],
        message: "A chart may contain at most one primary highlight."
      });
    }
    const datumIds = new Set<string>();
    spec.data.forEach((datum, index) => {
      if (datumIds.has(datum.id)) {
        addDataIssue(context, index, `Duplicate chart datum ID: ${datum.id}.`);
      }
      datumIds.add(datum.id);
    });
    spec.highlights.forEach((highlight, index) => {
      if (!datumIds.has(highlight.datumId)) {
        context.addIssue({
          code: "custom",
          path: ["highlights", index, "datumId"],
          message: `Highlight references missing datum: ${highlight.datumId}.`
        });
      }
    });

    const annotationIds = new Set<string>();
    spec.annotations.forEach((annotation, index) => {
      if (annotationIds.has(annotation.id)) {
        context.addIssue({
          code: "custom",
          path: ["annotations", index, "id"],
          message: `Duplicate annotation ID: ${annotation.id}.`
        });
      }
      annotationIds.add(annotation.id);
      if (annotation.datumId && !datumIds.has(annotation.datumId)) {
        context.addIssue({
          code: "custom",
          path: ["annotations", index, "datumId"],
          message: `Annotation references missing datum: ${annotation.datumId}.`
        });
      }
    });

    const referenceLineIds = new Set<string>();
    spec.referenceLines.forEach((referenceLine, index) => {
      if (referenceLineIds.has(referenceLine.id)) {
        context.addIssue({
          code: "custom",
          path: ["referenceLines", index, "id"],
          message: `Duplicate reference line ID: ${referenceLine.id}.`
        });
      }
      referenceLineIds.add(referenceLine.id);
    });

    if (ZERO_BASELINE_VARIANTS.has(spec.variant) && spec.encoding.zeroBaseline !== true) {
      context.addIssue({
        code: "custom",
        path: ["encoding", "zeroBaseline"],
        message: `${spec.variant} requires a truthful zero baseline because mark length encodes value.`
      });
    }

    if (CATEGORY_VALUE_VARIANTS.has(spec.variant)) {
      spec.data.forEach((datum, index) => {
        if (!datum.category || datum.value === undefined) {
          addDataIssue(
            context,
            index,
            `${spec.variant} requires category and value fields.`
          );
        }
        if (
          (spec.variant === "grouped-bar" ||
            spec.variant === "stacked-bar" ||
            spec.variant === "slope" ||
            spec.variant === "small-multiples") &&
          !datum.series
        ) {
          addDataIssue(context, index, `${spec.variant} requires a series field.`);
        }
        if (spec.variant === "bullet" && datum.target === undefined) {
          addDataIssue(context, index, "bullet requires a target value.");
        }
      });
    }

    if (spec.variant === "scatter" || spec.variant === "bubble") {
      spec.data.forEach((datum, index) => {
        if (datum.x === undefined || datum.y === undefined || datum.y === null) {
          addDataIssue(context, index, `${spec.variant} requires x and y values.`);
        }
        if (spec.variant === "bubble" && datum.size === undefined) {
          addDataIssue(context, index, "bubble requires size values.");
        }
      });
    }

    if (spec.variant === "histogram") {
      spec.data.forEach((datum, index) => {
        if (datum.value === undefined || datum.value === null) {
          addDataIssue(context, index, "histogram requires numeric value observations.");
        }
      });
    }

    if (spec.variant === "box-plot") {
      spec.data.forEach((datum, index) => {
        if (datum.low === undefined || datum.high === undefined) {
          addDataIssue(context, index, "box-plot requires low and high values.");
        }
      });
    }

    if (spec.variant === "heatmap") {
      spec.data.forEach((datum, index) => {
        if (
          datum.x === undefined ||
          datum.y === undefined ||
          datum.y === null ||
          datum.value === undefined
        ) {
          addDataIssue(context, index, "heatmap requires x, y and value fields.");
        }
      });
    }

    if (spec.variant === "calendar-heatmap") {
      spec.data.forEach((datum, index) => {
        if (!datum.date || datum.value === undefined) {
          addDataIssue(context, index, "calendar-heatmap requires date and value fields.");
        }
      });
    }

    if (spec.variant === "sankey") {
      spec.data.forEach((datum, index) => {
        if (!datum.source || !datum.targetNode || datum.value === undefined) {
          addDataIssue(context, index, "sankey requires source, targetNode and value fields.");
        }
      });
    }

    if (spec.variant === "gantt" || spec.variant === "timeline") {
      spec.data.forEach((datum, index) => {
        if (!datum.category || datum.start === undefined) {
          addDataIssue(context, index, `${spec.variant} requires category and start fields.`);
        }
        if (spec.variant === "gantt" && datum.end === undefined) {
          addDataIssue(context, index, "gantt requires end fields.");
        }
      });
    }

    if (spec.variant === "choropleth" || spec.variant === "proportional-symbol-map") {
      if (!spec.localGeoAssetId) {
        context.addIssue({
          code: "custom",
          path: ["localGeoAssetId"],
          message: `${spec.variant} requires a local geographic asset ID.`
        });
      }
      spec.data.forEach((datum, index) => {
        if (!datum.geographyKey || datum.value === undefined) {
          addDataIssue(context, index, `${spec.variant} requires geographyKey and value fields.`);
        }
      });
    }

    if (spec.animation.mode === "zero-to-value" && spec.encoding.zeroBaseline !== true) {
      context.addIssue({
        code: "custom",
        path: ["animation", "mode"],
        message: "zero-to-value animation requires a truthful zeroBaseline encoding."
      });
    }
  });

export type ChartSpec = z.infer<typeof ChartSpecSchema>;
