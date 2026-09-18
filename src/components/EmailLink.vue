<template>
  <a :href="href" :target="target" :rel="target === '_blank' ? 'noopener noreferrer' : undefined">
    <slot>{{ label }}</slot>
  </a>
</template>

<script setup lang="ts">
import {
  buildEmailPrepareHref,
  buildSendEmailHref,
  type EmailPrepareLinkOptions,
  type EmailRecipientInput,
} from '@/scripts/sendEmail';

const props = withDefaults(
  defineProps<{
    title?: string;
    to?: EmailRecipientInput;
    cc?: EmailRecipientInput;
    bcc?: EmailRecipientInput;
    content?: string;
    qslSendId?: number;
    qslReceiveId?: number;
    communicationLogId?: number;
    label?: string;
    target?: string;
  }>(),
  {
    label: '发送邮件',
    target: '_blank',
  }
);

const href = computed(() => {
  const prepareOptions: EmailPrepareLinkOptions = {
    qslSendId: props.qslSendId,
    qslReceiveId: props.qslReceiveId,
    communicationLogId: props.communicationLogId,
  };

  if (
    prepareOptions.qslSendId !== undefined ||
    prepareOptions.qslReceiveId !== undefined ||
    prepareOptions.communicationLogId !== undefined
  ) {
    return buildEmailPrepareHref(prepareOptions);
  }

  if (!props.title || !props.content) return '/send-email';
  return buildSendEmailHref({
    title: props.title,
    to: props.to,
    cc: props.cc,
    bcc: props.bcc,
    content: props.content,
  });
});
</script>
