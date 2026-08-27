import * as z from "zod";

const send_email_scehma = z.object({
  email_address: z.email(),
  email_content: z.string().nonempty(),
});

const resize_image_scehma = z.object({
  image: z.email(), //placeholder
  new_size: z.int64(), //placeholder
});

export const job_request_schema_v2 = z.discriminatedUnion("job_type", [
  z.object({ job_type: z.literal("send_email"), job_data: send_email_scehma }),
  z.object({
    job_type: z.literal("resize_image"),
    job_data: resize_image_scehma,
  }),
]);
