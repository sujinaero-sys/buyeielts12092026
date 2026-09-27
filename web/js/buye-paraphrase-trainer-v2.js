/**
 * BUYE IELTS Paraphrase Trainer — engine
 *
 * Data-driven: the JS never contains question content. It loads
 * data/paraphrase-bank.json (and optionally data/modules.json for
 * skill/type metadata) and renders whatever is in the bank.
 *
 * Usage:
 *   const trainer = new BuyeParaphraseTrainer('#trainer-root', {
 *     dataUrl: 'data/paraphrase-bank.json',
 *     modulesUrl: 'data/modules.json',
 *     skill: null,   // e.g. 'Listening' | 'Reading' | null for all
 *     type: null,    // e.g. 'number_time' | null for all
 *   });
 *   trainer.init();
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'buye_ielts_paraphrase_progress_v1';

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { attempted: {}, correct: {} };
    } catch (e) {
      return { attempted: {}, correct: {} };
    }
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      /* storage unavailable — trainer still works, just without persistence */
    }
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach((c) => c && node.appendChild(c));
    return node;
  }

  class BuyeParaphraseTrainer {
    constructor(target, options) {
      this.root = typeof target === 'string' ? document.querySelector(target) : target;
      if (!this.root) throw new Error('BuyeParaphraseTrainer: mount target not found');
      this.options = Object.assign(
        {
          dataUrl: 'data/paraphrase-bank.json',
          modulesUrl: 'data/modules.json',
          skill: null,
          type: null,
          shuffleOptions: true,
        },
        options || {}
      );
      this.bank = [];
      this.pool = [];
      this.current = null;
      this.answered = false;
      this.progress = loadProgress();
    }

    async init() {
      this.root.innerHTML = '';
      this.root.appendChild(el('div', { class: 'bpt-loading', text: 'Loading questions…' }));
      // Prefer inline data (used by self-contained single-file demos/artifacts
      // that cannot fetch external JSON) over a network fetch.
      const inline = document.getElementById(this.options.inlineDataId || 'bpt-data');
      try {
        if (inline && inline.textContent.trim()) {
          this.bank = JSON.parse(inline.textContent);
        } else {
          const res = await fetch(this.options.dataUrl);
          this.bank = await res.json();
        }
      } catch (e) {
        this.root.innerHTML = '';
        this.root.appendChild(
          el('div', { class: 'bpt-error', text: 'Could not load the question bank. Check data/paraphrase-bank.json is reachable.' })
        );
        return;
      }
      this.applyFilter(this.options.skill, this.options.type);
      this.render();
      this.next();
    }

    applyFilter(skill, type) {
      this.options.skill = skill;
      this.options.type = type;
      this.pool = this.bank.filter((item) => {
        if (skill && item.skill !== skill) return false;
        if (type && item.type !== type) return false;
        return true;
      });
    }

    availableSkills() {
      return Array.from(new Set(this.bank.map((i) => i.skill))).sort();
    }

    availableTypes() {
      return Array.from(new Set(this.bank.map((i) => i.type)));
    }

    stats() {
      const attemptedIds = Object.keys(this.progress.attempted).filter((id) =>
        this.pool.some((i) => i.id === id)
      );
      const correctIds = attemptedIds.filter((id) => this.progress.correct[id]);
      return {
        attempted: attemptedIds.length,
        correct: correctIds.length,
        total: this.pool.length,
        accuracy: attemptedIds.length ? Math.round((correctIds.length / attemptedIds.length) * 100) : 0,
      };
    }

    render() {
      this.root.innerHTML = '';
      this.root.className = 'bpt-root';

      this.filterBar = el('div', { class: 'bpt-filterbar' });
      this.card = el('div', { class: 'bpt-card' });
      this.progressBar = el('div', { class: 'bpt-progress-wrap' });

      this.root.appendChild(this.filterBar);
      this.root.appendChild(this.card);
      this.root.appendChild(this.progressBar);

      this.renderFilters();
    }

    renderFilters() {
      this.filterBar.innerHTML = '';
      const skillSelect = el('select', { class: 'bpt-select', 'aria-label': 'Skill' });
      skillSelect.appendChild(el('option', { value: '', text: 'All skills' }));
      this.availableSkills().forEach((s) => {
        const opt = el('option', { value: s, text: s });
        if (s === this.options.skill) opt.setAttribute('selected', 'selected');
        skillSelect.appendChild(opt);
      });
      skillSelect.addEventListener('change', () => {
        this.applyFilter(skillSelect.value || null, this.options.type);
        this.next();
      });

      const typeSelect = el('select', { class: 'bpt-select', 'aria-label': 'Paraphrase type' });
      typeSelect.appendChild(el('option', { value: '', text: 'All types' }));
      this.availableTypes().forEach((t) => {
        const opt = el('option', { value: t, text: t.replace('_', ' ') });
        if (t === this.options.type) opt.setAttribute('selected', 'selected');
        typeSelect.appendChild(opt);
      });
      typeSelect.addEventListener('change', () => {
        this.applyFilter(this.options.skill, typeSelect.value || null);
        this.next();
      });

      this.filterBar.appendChild(skillSelect);
      this.filterBar.appendChild(typeSelect);
    }

    next() {
      this.answered = false;
      if (!this.pool.length) {
        this.card.innerHTML = '';
        this.card.appendChild(el('div', { class: 'bpt-empty', text: 'No questions match this filter yet.' }));
        this.renderProgressBar();
        return;
      }
      const idx = Math.floor(Math.random() * this.pool.length);
      this.current = this.pool[idx];
      this.renderQuestion();
      this.renderProgressBar();
    }

    renderQuestion() {
      const item = this.current;
      this.card.innerHTML = '';

      const meta = el('div', { class: 'bpt-meta' }, [
        el('span', { class: 'bpt-badge', text: item.skill }),
        el('span', { class: 'bpt-badge bpt-badge-alt', text: item.type.replace('_', ' ') }),
      ]);

      const questionEl = el('div', { class: 'bpt-question' }, [
        el('div', { class: 'bpt-label', text: 'Question' }),
        el('p', { text: item.question }),
      ]);

      const contextEl = item.context
        ? el('div', { class: 'bpt-context' }, [
            el('div', { class: 'bpt-label', text: 'What you might hear' }),
            el('p', { text: item.context }),
          ])
        : null;

      const promptLabel = el('div', { class: 'bpt-label', text: 'What might you hear / read?' });
      const optionsWrap = el('div', { class: 'bpt-options' });

      const options = this.options.shuffleOptions ? shuffle(item.options) : item.options;
      options.forEach((opt) => {
        const btn = el('button', { class: 'bpt-option', type: 'button' }, [
          el('span', { class: 'bpt-option-label', text: opt.id }),
          el('span', { class: 'bpt-option-text', text: opt.text }),
        ]);
        btn.addEventListener('click', () => this.selectOption(opt, btn, optionsWrap));
        optionsWrap.appendChild(btn);
      });

      const feedback = el('div', { class: 'bpt-feedback', 'aria-live': 'polite' });
      const explanation = el('div', { class: 'bpt-explanation' });

      const actions = el('div', { class: 'bpt-actions' }, [
        this.button('Another', () => this.next()),
        this.button('Reveal', () => this.reveal(feedback, explanation, optionsWrap)),
      ]);

      this.card.appendChild(meta);
      this.card.appendChild(questionEl);
      if (contextEl) this.card.appendChild(contextEl);
      this.card.appendChild(promptLabel);
      this.card.appendChild(optionsWrap);
      this.card.appendChild(feedback);
      this.card.appendChild(explanation);
      this.card.appendChild(actions);

      this._feedbackEl = feedback;
      this._explanationEl = explanation;
      this._optionsWrapEl = optionsWrap;
    }

    button(label, onClick) {
      const b = el('button', { class: 'bpt-btn', type: 'button', text: label });
      b.addEventListener('click', onClick);
      return b;
    }

    selectOption(opt, btnEl, wrapEl) {
      if (this.answered) return;
      this.answered = true;
      const item = this.current;

      Array.from(wrapEl.children).forEach((c) => c.setAttribute('disabled', 'true'));
      btnEl.classList.add(opt.correct ? 'bpt-correct' : 'bpt-incorrect');
      if (!opt.correct) {
        const correctBtn = Array.from(wrapEl.children).find(
          (c) => c.querySelector('.bpt-option-label').textContent === this.correctOptionId(item)
        );
        if (correctBtn) correctBtn.classList.add('bpt-correct');
      }

      this.progress.attempted[item.id] = true;
      this.progress.correct[item.id] = !!opt.correct;
      saveProgress(this.progress);

      this._feedbackEl.textContent = opt.correct ? '✓ Meaning preserved' : '✗ Not quite — meaning changed';
      this._feedbackEl.className = 'bpt-feedback ' + (opt.correct ? 'bpt-feedback-good' : 'bpt-feedback-bad');
      this.renderExplanation();
      this.renderProgressBar();
    }

    correctOptionId(item) {
      const c = item.options.find((o) => o.correct);
      return c ? c.id : null;
    }

    reveal(feedbackEl, explanationEl, wrapEl) {
      if (this.answered) return;
      this.answered = true;
      const item = this.current;
      Array.from(wrapEl.children).forEach((c) => {
        c.setAttribute('disabled', 'true');
        if (c.querySelector('.bpt-option-label').textContent === this.correctOptionId(item)) {
          c.classList.add('bpt-correct');
        }
      });
      feedbackEl.textContent = 'Revealed — this one was not scored as attempted.';
      feedbackEl.className = 'bpt-feedback';
      this.renderExplanation();
    }

    renderExplanation() {
      const item = this.current;
      this._explanationEl.innerHTML = '';
      const kp = el('div', { class: 'bpt-keyphrases-label', text: 'Key paraphrases' });
      const list = el('ul', { class: 'bpt-keyphrases' });
      (item.key_paraphrases || []).forEach((p) => {
        list.appendChild(el('li', { text: `${p.original} → ${p.paraphrase}` }));
      });
      const explanationText = el('p', { class: 'bpt-explanation-text', text: item.explanation || '' });
      this._explanationEl.appendChild(kp);
      this._explanationEl.appendChild(list);
      if (item.explanation) this._explanationEl.appendChild(explanationText);
    }

    renderProgressBar() {
      const s = this.stats();
      this.progressBar.innerHTML = '';
      const label = el('div', {
        class: 'bpt-progress-label',
        text: `Progress: ${s.attempted} / ${s.total} attempted  ·  ${s.accuracy}% accuracy`,
      });
      const track = el('div', { class: 'bpt-progress-track' });
      const pct = s.total ? Math.round((s.attempted / s.total) * 100) : 0;
      const fill = el('div', { class: 'bpt-progress-fill' });
      fill.style.width = pct + '%';
      track.appendChild(fill);
      this.progressBar.appendChild(label);
      this.progressBar.appendChild(track);
    }
  }

  global.BuyeParaphraseTrainer = BuyeParaphraseTrainer;
})(window);
