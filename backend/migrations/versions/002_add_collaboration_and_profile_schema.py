"""Add collaboration, profile, milestone, and relationship schema

Revision ID: 002_collaboration_schema
Revises: 001_initial_schema
Create Date: 2026-08-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_collaboration_schema'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade():
    # -------------------------------------------------------------------------
    # 1. Update `users` table
    # -------------------------------------------------------------------------
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('display_name', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('auth_provider', sa.String(length=20), server_default='EMAIL', nullable=False))
        batch_op.add_column(sa.Column('is_email_verified', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.add_column(sa.Column('email_verification_token', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('reset_password_token', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('reset_password_expires_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('avatar_url', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('bio', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('role_title', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('skills', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('github_url', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('linkedin_url', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('website_url', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('is_open_to_work', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.alter_column('email', existing_type=sa.String(length=255), nullable=True)
        batch_op.alter_column('password_hash', existing_type=sa.String(length=255), nullable=True)

    # -------------------------------------------------------------------------
    # 2. Update `projects` table
    # -------------------------------------------------------------------------
    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.alter_column('key', existing_type=sa.String(length=10), type_=sa.String(length=20))
        batch_op.add_column(sa.Column('display_key', sa.String(length=20), nullable=True))

    # -------------------------------------------------------------------------
    # 3. Create `milestones` table
    # -------------------------------------------------------------------------
    op.create_table(
        'milestones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='OPEN', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_milestones_project_id'), 'milestones', ['project_id'], unique=False)

    # -------------------------------------------------------------------------
    # 4. Update `issues` table with milestone reference
    # -------------------------------------------------------------------------
    with op.batch_alter_table('issues', schema=None) as batch_op:
        batch_op.add_column(sa.Column('milestone_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_issues_milestone_id_milestones',
            'milestones',
            ['milestone_id'],
            ['id'],
            ondelete='SET NULL',
        )
        batch_op.create_index(op.f('ix_issues_milestone_id'), ['milestone_id'], unique=False)

    # -------------------------------------------------------------------------
    # 5. Create `invitations` table
    # -------------------------------------------------------------------------
    op.create_table(
        'invitations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('inviter_id', sa.Integer(), nullable=True),
        sa.Column('invitee_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=20), server_default='DEVELOPER', nullable=False),
        sa.Column('status', sa.String(length=20), server_default='PENDING', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['invitee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['inviter_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_invitations_invitee_id'), 'invitations', ['invitee_id'], unique=False)
    op.create_index(op.f('ix_invitations_project_id'), 'invitations', ['project_id'], unique=False)

    # -------------------------------------------------------------------------
    # 6. Create `notifications` table
    # -------------------------------------------------------------------------
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('issue_id', sa.Integer(), nullable=True),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['issue_id'], ['issues.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)

    # -------------------------------------------------------------------------
    # 7. Create `issue_relationships` table
    # -------------------------------------------------------------------------
    op.create_table(
        'issue_relationships',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('source_issue_id', sa.Integer(), nullable=False),
        sa.Column('target_issue_id', sa.Integer(), nullable=False),
        sa.Column('relationship_type', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['source_issue_id'], ['issues.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_issue_id'], ['issues.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_issue_relationships_source_issue_id'), 'issue_relationships', ['source_issue_id'], unique=False)
    op.create_index(op.f('ix_issue_relationships_target_issue_id'), 'issue_relationships', ['target_issue_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_issue_relationships_target_issue_id'), table_name='issue_relationships')
    op.drop_index(op.f('ix_issue_relationships_source_issue_id'), table_name='issue_relationships')
    op.drop_table('issue_relationships')

    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_table('notifications')

    op.drop_index(op.f('ix_invitations_project_id'), table_name='invitations')
    op.drop_index(op.f('ix_invitations_invitee_id'), table_name='invitations')
    op.drop_table('invitations')

    with op.batch_alter_table('issues', schema=None) as batch_op:
        batch_op.drop_constraint('fk_issues_milestone_id_milestones', type_='foreignkey')
        batch_op.drop_index(op.f('ix_issues_milestone_id'))
        batch_op.drop_column('milestone_id')

    op.drop_index(op.f('ix_milestones_project_id'), table_name='milestones')
    op.drop_table('milestones')

    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.drop_column('display_key')
        batch_op.alter_column('key', existing_type=sa.String(length=20), type_=sa.String(length=10))

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('password_hash', existing_type=sa.String(length=255), nullable=False)
        batch_op.alter_column('email', existing_type=sa.String(length=255), nullable=False)
        batch_op.drop_column('is_open_to_work')
        batch_op.drop_column('website_url')
        batch_op.drop_column('linkedin_url')
        batch_op.drop_column('github_url')
        batch_op.drop_column('skills')
        batch_op.drop_column('role_title')
        batch_op.drop_column('bio')
        batch_op.drop_column('avatar_url')
        batch_op.drop_column('reset_password_expires_at')
        batch_op.drop_column('reset_password_token')
        batch_op.drop_column('email_verification_token')
        batch_op.drop_column('is_email_verified')
        batch_op.drop_column('auth_provider')
        batch_op.drop_column('display_name')
