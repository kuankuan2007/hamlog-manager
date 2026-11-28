import assert from 'node:assert/strict';
import test from 'node:test';
import { createJiti } from 'jiti';
import ts from 'typescript';

const jiti = createJiti(import.meta.url, {
  alias: { '@util/time': new URL('../util/time.ts', import.meta.url).pathname },
});
const { createField, parseURLArgs, serializeURLArgs } = await jiti.import(
  '../src/scripts/urlArgs/parse.ts'
);
const { getURLArgs } = await jiti.import('../src/scripts/urlArgs/index.ts');
const { buildSendEmailHref, createEmailContentId, releaseEmailDraftLink, requestEmailDraft } =
  await jiti.import('../src/scripts/sendEmail.ts');

test('array defaults apply only when the query parameter is absent', () => {
  const config = { recipients: { type: 'array', default: ['default'] } };
  const fields = { recipients: createField(config.recipients) };
  assert.deepEqual(parseURLArgs(fields, config, ''), { recipients: ['default'] });
  assert.deepEqual(parseURLArgs(fields, config, '?recipients=one,two&recipients=two,three'), {
    recipients: ['one', 'two', 'three'],
  });
  assert.deepEqual(parseURLArgs(fields, config, '?recipients='), { recipients: [] });
});

test('serialization preserves unchanged array references and normalizes changed arrays', () => {
  const config = { recipients: { type: 'array' }, text: { type: 'string' } };
  const fields = { recipients: createField(config.recipients), text: createField(config.text) };
  const values = { recipients: ['one'], text: 'value' };
  const original = values.recipients;
  const url = new URL('https://example.test/?other=keep#anchor');
  serializeURLArgs(fields, config, values, url);
  assert.equal(values.recipients, original);
  assert.equal(url.searchParams.get('other'), 'keep');
  assert.equal(url.hash, '#anchor');
  values.recipients.push(' two ', 'one');
  serializeURLArgs(fields, config, values, url);
  assert.deepEqual(values.recipients, ['one', 'two']);
});

test('getURLArgs rejects calls outside a component scope', () => {
  assert.throws(() => getURLArgs({ value: { type: 'string' } }), /component setup scope/);
});

test('readonly field instances and dynamic configs expose readonly types', () => {
  const filename = `${process.cwd().replaceAll('\\', '/')}/url-args-type-test.ts`;
  const source = `
    import { DateTagField, getURLArgs } from './src/scripts/urlArgs/index';
    const editable = getURLArgs({ date: new DateTagField<false>() });
    editable.date = '2026-01-01';
    const readonly = getURLArgs({ date: new DateTagField({ readonly: true }) });
    // @ts-expect-error readonly field instances must prevent writes
    readonly.date = '2026-01-01';
    declare const dynamic: boolean;
    const uncertain = getURLArgs({ value: { type: 'string', readonly: dynamic } });
    // @ts-expect-error a dynamic readonly flag must be treated conservatively
    uncertain.value = 'changed';
  `;
  const options = {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    paths: { '@util/*': [`${process.cwd().replaceAll('\\', '/')}/util/*`] },
    skipLibCheck: true,
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, ...rest) =>
    name.replaceAll('\\', '/') === filename
      ? ts.createSourceFile(name, source, languageVersion, true)
      : getSourceFile(name, languageVersion, ...rest);
  const program = ts.createProgram([filename], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.deepEqual(
    diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
    []
  );
});

test('email draft links expose only an ID and transfer data to another channel', async () => {
  const id = createEmailContentId();
  const href = buildSendEmailHref({ title: 'title', content: 'private', to: ['one'] }, id);
  try {
    assert.equal(href, `/send-email?email-content-id=${id}`);
    assert.deepEqual(await requestEmailDraft(id), {
      title: 'title',
      content: 'private',
      to: ['one'],
      cc: undefined,
      bcc: undefined,
    });
  } finally {
    releaseEmailDraftLink(id);
  }
});
