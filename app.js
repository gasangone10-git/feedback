(() => {
  const config = window.CLASS_FEEDBACK_CONFIG;
  const supabaseSdk = window.supabase;
  const studentView = document.querySelector("#student-view");
  const adminView = document.querySelector("#admin-view");
  const loginDialog = document.querySelector("#login-dialog");
  const studentMessage = document.querySelector("#student-message");
  const loginMessage = document.querySelector("#login-message");
  const adminMessage = document.querySelector("#admin-message");
  const numberFormat = new Intl.NumberFormat("ko-KR");

  if (!config || !config.url || !config.publishableKey || !supabaseSdk) {
    studentMessage.textContent = "앱 설정을 불러오지 못했습니다. 잠시 후 다시 접속해 주세요.";
    studentMessage.classList.add("is-error");
    document.querySelectorAll(".rating-card, #admin-entry").forEach((button) => {
      button.disabled = true;
    });
    console.error("Supabase client configuration or SDK is missing.");
    return;
  }

  const client = supabaseSdk.createClient(config.url, config.publishableKey);
  const ratingButtons = [...document.querySelectorAll(".rating-card")];
  const loginForm = document.querySelector("#login-form");
  const loginSubmit = document.querySelector("#login-submit");
  const refreshButton = document.querySelector("#refresh-results");
  const resetButton = document.querySelector("#reset-results");

  function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("is-error", isError);
  }

  function showStudentView() {
    studentView.hidden = false;
    adminView.hidden = true;
    document.querySelector("#admin-entry").hidden = false;
  }

  async function showAdminView() {
    studentView.hidden = true;
    adminView.hidden = false;
    document.querySelector("#admin-entry").hidden = true;
    await loadResults();
  }

  async function loadResults() {
    refreshButton.disabled = true;
    showMessage(adminMessage, "");

    try {
      const ratings = [];
      const pageSize = 1000;
      let from = 0;

      while (true) {
        const { data, error } = await client
          .from("votes")
          .select("rating")
          .range(from, from + pageSize - 1);
        if (error) throw error;

        ratings.push(...data.map((vote) => vote.rating));
        if (data.length < pageSize) break;
        from += pageSize;
      }

      renderResults(ratings);
    } catch (error) {
      console.error("Could not load vote results:", error);
      showMessage(adminMessage, "결과를 불러오지 못했습니다. 다시 시도해 주세요.", true);
    } finally {
      refreshButton.disabled = false;
    }
  }

  function renderResults(ratings) {
    const total = ratings.length;
    const counts = {
      만족: ratings.filter((rating) => rating === "만족").length,
      보통: ratings.filter((rating) => rating === "보통").length,
      불만족: ratings.filter((rating) => rating === "불만족").length,
    };

    document.querySelector("#total-count").textContent = numberFormat.format(total);
    document.querySelectorAll(".result-row").forEach((row) => {
      const count = counts[row.dataset.result];
      const percent = total === 0 ? 0 : (count / total) * 100;
      row.querySelector(".result-count").textContent = numberFormat.format(count);
      row.querySelector(".result-percent").textContent = `${percent.toFixed(1)}%`;
      row.querySelector(".bar-fill").style.width = `${percent}%`;
    });
  }

  ratingButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      ratingButtons.forEach((ratingButton) => {
        ratingButton.disabled = true;
      });
      showMessage(studentMessage, "");

      const { error } = await client.from("votes").insert({ rating: button.dataset.rating });
      if (error) {
        console.error("Could not save vote:", error);
        showMessage(studentMessage, "투표를 저장하지 못했습니다. 다시 시도해 주세요.", true);
        ratingButtons.forEach((ratingButton) => {
          ratingButton.disabled = false;
        });
        return;
      }

      showMessage(studentMessage, "투표가 완료되었습니다. 감사합니다.");
    });
  });

  document.querySelector("#admin-entry").addEventListener("click", () => {
    showMessage(loginMessage, "");
    loginForm.reset();
    loginDialog.showModal();
  });

  document.querySelector("#close-login").addEventListener("click", () => {
    loginDialog.close();
  });

  loginDialog.addEventListener("click", (event) => {
    if (event.target === loginDialog) loginDialog.close();
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginSubmit.disabled = true;
    showMessage(loginMessage, "");
    const formData = new FormData(loginForm);

    const { error } = await client.auth.signInWithPassword({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    loginSubmit.disabled = false;
    if (error) {
      console.error("Admin login failed:", error);
      showMessage(loginMessage, "로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.", true);
      return;
    }

    loginDialog.close();
  });

  refreshButton.addEventListener("click", loadResults);

  resetButton.addEventListener("click", async () => {
    const confirmed = window.confirm("모든 투표 결과를 초기화하시겠습니까? 삭제된 결과는 복구할 수 없습니다.");
    if (!confirmed) return;

    resetButton.disabled = true;
    showMessage(adminMessage, "");
    const { error } = await client.from("votes").delete().gt("id", 0);
    resetButton.disabled = false;

    if (error) {
      console.error("Could not reset vote results:", error);
      showMessage(adminMessage, "투표 결과를 초기화하지 못했습니다. 다시 시도해 주세요.", true);
      return;
    }

    renderResults([]);
    showMessage(adminMessage, "모든 투표 결과를 초기화했습니다.");
  });

  document.querySelector("#logout").addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    if (error) {
      console.error("Admin logout failed:", error);
      showMessage(adminMessage, "로그아웃하지 못했습니다. 다시 시도해 주세요.", true);
    }
  });

  client.auth.onAuthStateChange((_event, session) => {
    if (session) {
      void showAdminView();
    } else {
      showStudentView();
    }
  });

  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error("Could not check the current session:", error);
      return;
    }
    if (data.session) void showAdminView();
  });
})();
